import React from 'react';
import { Card, Row, Col, Avatar, Typography, Button } from 'antd';
import axios from 'axios';
import { CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons';
import moment from 'moment';
import * as Constants from '../../Constants'; 

const MAX_MALE_HR = 120;
const MAX_FEMALE_HR = 90;
const INTERVAL_TIME = 1000;

class HR {
    constructor(gender = 'male') {
        this.AVG_NORMAL_HR = 60;
        this.MAX_DIFF_FITNESS_HR = 5;
        this.MIN_FITNESS_HR = 65;
        this.MAX_FITNESS_HR = (gender == 'male' ? MAX_MALE_HR-80 : MAX_FEMALE_HR-80) + Math.round(Math.random() * 120);
    }

    RandomNormalHR() {
        return this.AVG_NORMAL_HR + Math.round((Math.random() - 0.5) * 20);
    }

    Equation(x) { // 0 -> 1
        return x;
        if (x < 0.5) return x + x/0.5*1.6;
        return x + (1-(x-0.5)/0.5) * 1.6;
    }

    RandomFitnessHR(currentHr) {
        const alpha = currentHr < this.MIN_FITNESS_HR ? 0.3 : currentHr > this.MAX_FITNESS_HR ? 0.7 :
            1 - this.Equation((this.MAX_FITNESS_HR - currentHr) / (this.MAX_FITNESS_HR - this.MIN_FITNESS_HR));
        const diff = Math.round((Math.random() - alpha) * (this.MAX_DIFF_FITNESS_HR - alpha * this.MAX_DIFF_FITNESS_HR/2));
        return currentHr + diff;
    }

    IncreaseFitness() {
        this.MAX_FITNESS_HR += 30;
        this.MIN_FITNESS_HR += 30;
    }

    DecreaseFitness() {
        this.MAX_FITNESS_HR -= 30;
        this.MIN_FITNESS_HR -= 30;
    }
}

//
function SendPerformance(data) {
    axios.post(`${Constants.BASE_URL}/members/${data.MemberId}/performance`, data)
        .then(res => console.log('SUCCESS', res))
        .catch(err => console.log('ERROR', err));
}
function RenewPerformace(memberId, classId) {
    SendPerformance({
        ClassId: classId,
        MemberId: memberId,

        Hr: 0,
        Calories: 0,
        Zone1: 0,
        Zone2: 0,
        Zone3: 0,
        Zone4: 0,
        Zone5: 0,
        Heavyload: 0,

        PeakHr: 0,
        PercentHr: 0,
        PeakPercentHr: 0,
        VO2: 0,
        PeakVO2: 0,
        PercentVO2: 0,
        PeakPercentVO2: 0,
    })
}
function CheckIn(memberId, classId) {
    return axios.post(`${Constants.BASE_URL}/classes/${classId}/updateMember`, {
        ClassId: classId,
        MemberId: memberId,
        isCheckIn: true
    })
}

// Performance
function CalculateCalories(gender, weight, age, hr, durationTime = INTERVAL_TIME/1000/3600) {
    let calo = 0;
    if (gender == 'male') calo = ((-55.0969 + (0.6309 * hr) + (0.1988 * weight) + (0.2017 * age))/4.184) * 60 * durationTime;
    else calo = ((-20.4022 + (0.4472 * hr) - (0.1263 * weight) + (0.074 * age))/4.184) * 60 * durationTime;
    return calo < 0 ? 0 : calo;
}
function CalculatePercentHR(gender, hr, maxHr) {
    return Math.round(hr/maxHr * 100);
    if (gender == 'male') return Math.round(hr/MAX_MALE_HR * 100);
    return Math.round(hr/MAX_FEMALE_HR * 100);
}
function CalculateZone(percentHr) {
    if (percentHr <= 60) return 1;
    if (percentHr <= 70) return 2;
    if (percentHr <= 80) return 3;
    if (percentHr <= 90) return 4;
    return 5;
}
function CalculateVO2(hr, rhr) {
    return 15.3 * (hr / rhr);
}
function CalculatePercentVO2(vo2, maxVo2) {
    return Math.round(vo2/maxVo2 * 100);
}

function GetZoneColor(percentHr) {
    if (percentHr <= 60) return 'gray';
    if (percentHr <= 70) return 'blue';
    if (percentHr <= 80) return 'green';
    if (percentHr <= 90) return 'orange';
    return 'red';
}

export default class MemberCard extends React.Component {
    constructor(props) {
        super(props);

        this.HR = new HR(props.info.memberInfo.gender ? 'male' : 'famale');

        // Performance
        const initHr = this.HR.RandomNormalHR();
        const initPercentHr = CalculatePercentHR(props.info.memberInfo.gender ? 'male' : 'famale', initHr, props.info.memberInfo.maxHr);
        const initVO2 = parseFloat(CalculateVO2(initHr, props.info.memberInfo.restHr).toFixed(3));
        const initPercentVO2 = CalculatePercentVO2(initVO2, props.info.memberInfo.maxVO2);
        this.performance = {
            ClassId: this.props.classId,
            MemberId: this.props.info.memberInfo.id,

            Hr: initHr,
            Calories: 0,
            Zone1: 0,
            Zone2: 0,
            Zone3: 0,
            Zone4: 0,
            Zone5: 0,
            Heavyload: 0,

            PeakHr: initHr,
            PercentHr: initPercentHr,
            PeakPercentHr: initPercentHr,
            VO2: initVO2,
            PeakVO2: initVO2,
            PercentVO2: initPercentVO2,
            PeakPercentVO2: initPercentVO2
        };

        this.state = {
            currentHr: this.performance.Hr,
            emulatorInterval: undefined,
            isEmulatorRun: false,
            isCrease: false,
            time: 0,
            status: props.info.status
        };

        // Renew
        RenewPerformace(this.props.info.memberInfo.id, this.props.classId);
        // Reset status
        this.UpdateStatus = (status) => {
            axios.post(`${Constants.BASE_URL}/classes/${this.props.classId}/updateMember`, {
                ClassId: this.props.classId,
                MemberId: this.props.info.memberInfo.id,
                isCheckIn: status == "Checked-in"
            }).then(() => {
                this.setState({
                    status: status
                });
            })
        };
        this.UpdateStatus('Booked');

        this.RunEmulator = () => {
            if (this.state.status === 'Checked-in' && !this.state.isEmulatorRun) {
                this.setState({
                    emulatorInterval: setInterval(() => {
                        const gender = this.props.info.memberInfo.gender ? 'male' : 'female';
                        const { weight, age, restHr, maxHr, maxVO2 } = this.props.info.memberInfo;

                        // Calculate performace
                        this.performance.Hr = this.HR.RandomFitnessHR(this.performance.Hr);
                        this.performance.PercentHr = CalculatePercentHR(gender, this.performance.Hr, maxHr);
                        this.performance.Calories = parseFloat((this.performance.Calories + CalculateCalories(gender, weight, age, this.performance.Hr)).toFixed(3));
                        this.performance['Zone' + CalculateZone(this.performance.PercentHr)] += 1;
                        this.performance.Heavyload = this.performance.Zone4 + this.performance.Zone5;
                        this.performance.PeakHr = this.performance.Hr > this.performance.PeakHr ? this.performance.Hr : this.performance.PeakHr;
                        this.performance.PeakPercentHr = this.performance.PercentHr > this.performance.PeakPercentHr ? this.performance.PercentHr : this.performance.PeakPercentHr;
                        this.performance.VO2 = parseFloat(CalculateVO2(this.performance.Hr, restHr).toFixed(3));
                        this.performance.PeakVO2 = this.performance.VO2 > this.performance.PeakVO2 ? this.performance.VO2 : this.performance.PeakVO2;
                        this.performance.PercentVO2 = CalculatePercentVO2(this.performance.VO2, maxVO2);
                        this.performance.PeakPercentVO2 = this.performance.PercentVO2 > this.performance.PeakPercentVO2 ? this.performance.PercentVO2 : this.performance.PeakPercentVO2;

                        SendPerformance(this.performance);
                        this.setState({
                            currentHr: this.performance.Hr,
                            time: this.state.time + INTERVAL_TIME/1000
                        });
                    }, INTERVAL_TIME),
                    isEmulatorRun: true
                });
            };
        };
        this.StopEmulator = () => {
            if (this.state.isEmulatorRun) {
                clearInterval(this.state.emulatorInterval);
                this.setState({
                    emulatorInterval: undefined,
                    isEmulatorRun: false
                })
            }
        };

        this.IncreaseFitness = () => {
            this.HR.IncreaseFitness();
            this.setState({
                isCrease: true
            })
            setTimeout(() => {
                this.setState({
                    isCrease: false
                })
            }, 3000)
        }
        this.DecreaseFitness = () => {
            this.HR.DecreaseFitness();
            this.setState({
                isCrease: true
            })
            setTimeout(() => {
                this.setState({
                    isCrease: false
                })
            }, 3000)
        }

        // Event
        this.props.startSubcribers.push(this.RunEmulator);
        this.props.stopSubcribers.push(this.StopEmulator);
        this.props.joinSubcribers.push(() => {
            this.UpdateStatus('Checked-in');
        });
    }

    render() {
        //const { status } = this.props.info;
        const { id, fullName, photoURL, gender, weight, age, maxHr } = this.props.info.memberInfo;
        const { currentHr, isEmulatorRun, isCrease, time, status } = this.state;
        const { Calories, Zone1, Zone2, Zone3, Zone4, Zone5, Heavyload, PercentHr, PeakHr, PeakPercentHr, VO2, PeakVO2 } = this.performance;
        return (
            <Card bodyStyle={{
                padding: 10
            }}>
                <Row>
                    <Col span={7}>
                        <Avatar src={photoURL} size={100} />
                    </Col>
                    <Col span={17}>
                        <Row>
                            <Col>
                                <Typography.Text strong style={{
                                    fontSize: '1.3em'
                                }}>{`[${id}]${fullName}`}</Typography.Text>
                                <span>
                                    {` (${gender ? 'male' : 'female'} - ${age} ya - ${weight} kg) ${moment.utc(time * 1000).format('HH:mm:ss')}`}
                                </span>
                            </Col>
                        </Row>
                        <Row gutter={10}>
                            <Col span={8}>
                            {
                                status == 'Booked' ?
                                <Button type='primary' style={{
                                    backgroundColor: 'yellow',
                                    width: '100%',
                                    color: 'red'
                                }} onClick={() => {
                                    CheckIn(id, this.props.classId).then(res => {
                                        this.setState({
                                            status: 'Checked-in'
                                        })
                                    }).catch(err => console.catch('ERROR', err));
                                }}>Join</Button> :
                                !isEmulatorRun ?
                                <Button type='primary' style={{
                                    width: '100%'
                                }} onClick={() => {
                                    this.RunEmulator();
                                }}>Start</Button> :
                                <Button type='primary' danger style={{
                                    width: '100%'
                                }} onClick={() => {
                                    this.StopEmulator();
                                }}>Stop</Button>
                            }
                            </Col>
                            <Col span={8}>
                                <Button style={{
                                    width: '100%'
                                }} icon={<CaretUpOutlined />} loading={isCrease} onClick={() => {
                                    this.IncreaseFitness();
                                }}></Button>
                            </Col>
                            <Col span={8}>
                                <Button style={{
                                    width: '100%'
                                }} icon={<CaretDownOutlined />} loading={isCrease} onClick={() => {
                                    this.DecreaseFitness();
                                }}></Button>
                            </Col>
                        </Row>
                        <Row gutter={10}>
                            <Col span={8}><Typography.Text>HR: {`${currentHr} / ${PeakHr}`}</Typography.Text></Col>
                            <Col span={8}><Typography.Text style={{
                                color: GetZoneColor(PercentHr)
                            }}>%HR: {`${PercentHr} / ${PeakPercentHr}`}</Typography.Text></Col>
                            <Col span={8}><Typography.Text>MaxHr: {maxHr}</Typography.Text></Col>
                        </Row>
                        <Row gutter={10}>
                            <Col span={12}><Typography.Text>VO2: {`${VO2} / ${PeakVO2}`}</Typography.Text></Col>
                        </Row>
                        <Row gutter={10}>
                            <Col span={12}><Typography.Text>Calories: {Calories}</Typography.Text></Col>
                            <Col span={12}><Typography.Text strong>Splat point: {Heavyload}</Typography.Text></Col>
                        </Row>
                    </Col>
                </Row>
                <Row gutter={10} justify='space-between'>
                    <Col style={{
                        backgroundColor: 'gray',
                        color: 'white',
                        fontWeight: 'bold',
                        width: '20%',
                        textAlign: 'center'
                    }}><Typography.Text style={{
                        color: 'white'
                    }}>{Zone1}</Typography.Text></Col>
                    <Col style={{
                        backgroundColor: 'blue',
                        color: 'white',
                        fontWeight: 'bold',
                        width: '20%',
                        textAlign: 'center'
                    }}><Typography.Text style={{
                        color: 'white'
                    }}>{Zone2}</Typography.Text></Col>
                    <Col style={{
                        backgroundColor: 'green',
                        color: 'white',
                        fontWeight: 'bold',
                        width: '20%',
                        textAlign: 'center'
                    }}><Typography.Text style={{
                        color: 'white'
                    }}>{Zone3}</Typography.Text></Col>
                    <Col style={{
                        backgroundColor: 'orange',
                        color: 'white',
                        fontWeight: 'bold',
                        width: '20%',
                        textAlign: 'center'
                    }}><Typography.Text style={{
                        color: 'white'
                    }}>{Zone4}</Typography.Text></Col>
                    <Col style={{
                        backgroundColor: 'red',
                        fontWeight: 'bold',
                        width: '20%',
                        textAlign: 'center'
                    }}><Typography.Text style={{
                        color: 'white'
                    }}>{Zone5}</Typography.Text></Col>
                </Row>
            </Card>
        );
    }
    
    componentDidMount() {
        // Run emulator
        //console.log('Run emulator', this.HR.MAX_FITNESS_HR);
        //this.RunEmulator();
    }
}