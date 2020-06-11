import React from 'react';
import MemberCard from '../MemberCard';
import axios from 'axios';
import { Row, Col } from 'antd';
import * as Constants from '../../Constants'; 

function FetchRoster(classId) {
    return axios.get(`${Constants.BASE_URL}/classes/${classId}/roster`);
};

export default class Roster extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            roster: []
        };
    }
    render() {
        const { roster } = this.props;
        return (
            <div style={{
                width: "100%"
            }}>
                <Row gutter={[10, 10]} style={{
                    padding: 10
                }}>
                {
                    (roster || []).length === 0 ? "No members" :
                    roster.map(member => <Col key={member.id} span={8} md={12}>
                        <MemberCard classId={this.props.classId} info={member} startSubcribers={this.props.startSubcribers} stopSubcribers={this.props.stopSubcribers} joinSubcribers={this.props.joinSubcribers}/>
                    </Col>)
                }
                </Row>
            </div>
        );
    }
    componentDidMount() {
        /*
        FetchRoster(this.props.classId)
            .then(res => {
                console.log('SUCCESS', res);
                this.setState({
                    roster: res.data.rosters
                })
            })
            .catch(err => console.log('ERROR', 'Failure to fetch roster', err));
        */
    }
}