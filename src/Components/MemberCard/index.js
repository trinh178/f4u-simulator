import React from 'react';
import { Card, Row, Col, Avatar, Typography, Button } from 'antd';
import axios from 'axios';
import { CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons';

const MAX_MALE_HR = 180;
const MAX_FEMALE_HR = 150;

class HR {
    constructor(gender = 'male') {
        this.AVG_NORMAL_HR = 30;
        this.MAX_DIFF_FITNESS_HR = 5;
        this.MIN_FITNESS_HR = 65;
        this.MAX_FITNESS_HR = (gender == 'male' ? MAX_MALE_HR-80 : MAX_FEMALE_HR-80) + Math.round(Math.random() * 120);
        console.log('MAX_FITNESS_HR', this.MAX_FITNESS_HR, gender);
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
        console.log('diff', diff, currentHr, alpha);
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
    /*
    axios.post('https://94fyda15f0.execute-api.us-east-1.amazonaws.com/Prod/api/members/1/performance', data)
        .then(res => console.log('SUCCESS', res))
        .catch(err => console.log('ERROR', err));
    */
}

// Performance
function CalculateCalories(gender, weight, age, hr, durationTime = 1) {
    if (gender == 'male') return Math.round(((-55.0969 + (0.6309 * hr) + (0.1988 * weight) + (0.2017 * age))/4.184) * 60 * durationTime);
    return Math.round(((-20.4022 + (0.4472 * hr) - (0.1263 * weight) + (0.074 * age))/4.184) * 60 * durationTime)
}
function CalculatePercentHR(gender, hr) {
    if (gender == 'male') return Math.round(hr/MAX_MALE_HR * 100);
    return Math.round(hr/MAX_FEMALE_HR * 100);
}
function CalculateZone(percentHr) {
    if (percentHr < 25) return 1;
    if (percentHr < 45) return 2;
    if (percentHr < 75) return 3;
    if (percentHr < 85) return 4;
    return 5
}

export default class MemberCard extends React.Component {
    constructor(props) {
        super(props);

        this.HR = new HR(props.info.memberInfo.gender ? 'male' : 'famale');

        // Performance
        this.performance = {
            ClassId: 1,
            MemberId: this.props.info.memberInfo.id,

            Hr: this.HR.RandomNormalHR(),
            Calories: 0,
            Zone1: 0,
            Zone2: 0,
            Zone3: 0,
            Zone4: 0,
            Zone5: 0,
            SplatPoint: 0
        };

        this.state = {
            currentHr: this.performance.Hr,
            emulatorInterval: undefined,
            isEmulatorRun: false,
            isCrease: false,
        };

        this.RunEmulator = () => {
            this.setState({
                emulatorInterval: setInterval(() => {
                    const gender = this.props.info.memberInfo.gender ? 'male' : 'female';
                    const { weight, age } = this.props.info.memberInfo;

                    // Calculate performace
                    this.performance.Hr = this.HR.RandomFitnessHR(this.performance.Hr);
                    this.performance.PercentHr = CalculatePercentHR(gender, this.performance.Hr);
                    this.performance.Calories = CalculateCalories(gender, weight, age, this.performance.Hr);
                    this.performance['Zone' + CalculateZone(this.performance.PercentHr)] += 1;
                    this.performance.SplatPoint = this.performance.Zone4 + this.performance.Zone5;

                    SendPerformance(this.performance);
                    this.setState({
                        currentHr: this.performance.Hr
                    });
                }, 100),
                isEmulatorRun: true
            });
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
    }

    render() {
        const { fullName, photoURL, gender } = this.props.info.memberInfo;
        const { currentHr, isEmulatorRun, isCrease } = this.state;
        const { Calories, Zone1, Zone2, Zone3, Zone4, Zone5, SplatPoint, PercentHr } = this.performance;
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
                            <Col><Typography.Title level={4}>{fullName}</Typography.Title></Col>
                        </Row>
                        <Row gutter={10}>
                            <Col span={8}>
                            {
                                !isEmulatorRun ?
                                <Button style={{
                                    width: '100%'
                                }} onClick={() => {
                                    this.RunEmulator();
                                }}>Start</Button> :
                                <Button style={{
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
                            <Col span={8}><Typography.Text>HR: {currentHr}</Typography.Text></Col>
                            <Col span={8}><Typography.Text>MaxHR: {gender ? MAX_MALE_HR : MAX_FEMALE_HR}</Typography.Text></Col>
                            <Col span={8}><Typography.Text>%HR: {PercentHr}</Typography.Text></Col>
                        </Row>
                        <Row gutter={10}>
                            <Col span={12}><Typography.Text>Calories: {Calories}</Typography.Text></Col>
                            <Col span={12}><Typography.Text>Splat point: {SplatPoint}</Typography.Text></Col>
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
        this.RunEmulator();
    }
}