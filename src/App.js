import React from 'react';
import { Roster } from './Components';
import { Row, Col, Button, Input, Modal, Menu, Dropdown, Avatar } from 'antd';
import axios from 'axios';
import * as Constants from './Constants';

function parseQueryString() {
  const str = window.location.search;
  console.log('search', str)
  const objURL = {};

  str.replace(
      new RegExp( "([^?=&]+)(=([^&]*))?", "g" ),
      function( $0, $1, $2, $3 ){
          objURL[ $1 ] = $3;
      }
  );
  return objURL;
};

function fetchMembers(classId) {
  return axios.get(`${Constants.BASE_URL}/members`).then(res => {
    const members = res.data.members;
    return axios.get(`${Constants.BASE_URL}/classes/${classId}/roster`).then(res2 => {
      const exIds = res2.data.rosters ? res2.data.rosters.map(r => r.memberInfo.id) : [];
      return Promise.resolve(members.filter(m => !exIds.includes(m.id)))
    }).catch(err => Promise.reject(err));;
  }).catch(err => Promise.reject(err));;
}
function bookMember(classId, memberId) {
  return axios.post(`${Constants.BASE_URL}/classes/${classId}/addMember`, {
    memberId,
    classId
  });
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.startSubcribers = [];
    this.stopSubcribers = [];
    this.joinSubcribers = [];

    this.Renew = (id) => {
      window.location.reload();
    }

    const params = parseQueryString();
    this.classId = parseInt(params.classId) || 1;

    this.state = {
      isRenewwing: false,
      isStarting: false,
      isStopping: false,
      classId: 1,
      modalVisible: false,

      isFetchingMembers: true,
      members: [],
      selectedMember: undefined,

      rosters: []
    };

    // Event
    this.StartAll = () => {
      this.startSubcribers.forEach(run => run());
    };
    this.StopAll = () => {
      this.stopSubcribers.forEach(run => run());
    };
    this.JoinAll = () => {
      this.joinSubcribers.forEach(run => run());
    }

    // Modal
    this.showModal = () => {
      this.setState({
        modalVisible: true,
        isFetchingMembers: true,
        members: [],
        selectedMember: undefined
      });
      fetchMembers(this.classId).then(members => {
        this.setState({
          members: members,
          isFetchingMembers: false,
        });
      });
    };
  
    this.handleOk = e => {
      console.log(e);
      this.setState({
        modalVisible: false,
      });
      if (this.state.selectedMember) {
        bookMember(this.classId, this.state.selectedMember).then(res => {
          this.fetchRoster(this.classId);
        })
      }
    };
  
    this.handleCancel = e => {
      console.log(e);
      this.setState({
        modalVisible: false,
      });
    };

    //
    this.fetchRoster = (classId) => {
      axios.get(`${Constants.BASE_URL}/classes/${classId}/roster`).then(res => {
        this.setState({
          rosters: res.data.rosters
        });
      });
    }
  }
  render() {
    const params = parseQueryString();
    console.log(params);
    const classId = parseInt(params.classId) || 1;
    return (
      <div>
        <Row gutter={10}>
          {/*
          <Col>
            <Button type='primary' onClick={() => {
              this.startSubcribers.forEach(element => {
                
              });
            }}>Start all</Button>
          </Col>
          <Col>
            <Button type='primary'>Stop all</Button>
          </Col>
          */}
          <Col>
            <Button loading={this.state.isRenewwing} type='primary' onClick={() => {
              this.setState({
                isRenewwing: true
              })
              this.Renew(1);
            }}>Reset</Button>
          </Col>
          <Col>
            <Button loading={this.state.isRenewwing} type='primary' onClick={() => {
              this.JoinAll();
            }}>Join All</Button>
          </Col>
          <Col>
            <Button loading={this.state.isRenewwing} type='primary' onClick={() => {
              this.StartAll();
            }}>Start All</Button>
          </Col>
          <Col>
            <Button loading={this.state.isRenewwing} type='primary' onClick={() => {
              this.StopAll();
            }}>Stop All</Button>
          </Col>
          <Col>
            <Input.Search
              placeholder="class id"
              onSearch={value => {
                window.location.href = "/f4u-emulator-tools?classId=" + value
              }}
              style={{ width: 200 }}
            />
            <span>{`Current class id = ${classId}`}</span>
          </Col>
          <Col>
            <Button type="primary" onClick={this.showModal}>Book member</Button>
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <Roster roster={this.state.rosters} classId={classId} startSubcribers={this.startSubcribers} stopSubcribers={this.stopSubcribers} joinSubcribers={this.joinSubcribers}/>
          </Col>
        </Row>
        <Modal
          title="Book member"
          visible={this.state.modalVisible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
        >
          {
            this.state.isFetchingMembers ? "Loading.." : (
              <select onChange={e => {
                this.setState({
                  selectedMember: parseInt(e.target.value)
                })
              }}>
                <option selected disabled>Select member</option>
                {
                  this.state.members.map(m => (
                    <option key={m.id} value={m.id}>{m.fullName}</option>
                  ))
                }
              </select>
            )
          }
        </Modal>
      </div>
    );
  }

  componentDidMount() {
    this.fetchRoster(this.classId);
  }
}

export default App;
