import React from 'react';
import MemberCard from '../MemberCard';
import axios from 'axios';
import { Row, Col } from 'antd';

function FetchRoster() {
    return axios.get('https://94fyda15f0.execute-api.us-east-1.amazonaws.com/Prod/api/classes/1/roster');
};

export default class Roster extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            roster: []
        };
    }
    render() {
        const { roster } = this.state;
        return (
            <div>
                <Row gutter={[10, 10]} style={{
                    padding: 10
                }}>
                {
                    roster.map(member => <Col key={member.id} span={8}>
                        <MemberCard info={member}/>
                    </Col>)
                }
                </Row>
            </div>
        );
    }
    componentDidMount() {
        FetchRoster()
            .then(res => {
                console.log('SUCCESS', res);
                this.setState({
                    roster: res.data.rosters
                })
            })
            .catch(err => console.log('ERROR', 'Failure to fetch roster', err));
    }
}