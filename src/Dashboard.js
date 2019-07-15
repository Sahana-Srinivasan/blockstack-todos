import React, { Component } from 'react'
import { UserSession } from 'blockstack'
import NavBar from './NavBar'
import {jsonCopy, remove, add, check} from './utils'
import { appConfig, TASKS_FILENAME } from './constants'
import './Dashboard.css'
import { Model, User, configure } from 'radiks'

class Testing extends Model {
  static className = 'Testing';
  static schema = { // all fields are encrypted by default
    task: String,
    completed: {
      type: Boolean,
      decrypted: true
    },
    project: String
  }
};


class Dashboard extends Component {

  constructor(props) {
    super(props)
    this.userSession = this.props.userSession
    this.state = {
      tasks: [],
      value: '',
      pending: [],
      completed: []

    }

    this.loadTasks = this.loadTasks.bind(this)
    this.signOut = this.signOut.bind(this)
    this.handleChange = this.handleChange.bind(this)
    this.addTask = this.addTask.bind(this)
    this.removeTask = this.removeTask.bind(this)
    this.checkTask = this.checkTask.bind(this)
  }

  async componentWillMount() {
    configure({
      apiServer: 'http://localhost:1260',
      userSession: this.userSession
    })

    this.loadTasks()
  }

  componentWillReceiveProps(nextProps) {
    const nextTasks = nextProps.tasks
    if(nextTasks) {
      if (nextTasks.length !== this.state.tasks.length) {
        this.setState({ tasks: jsonCopy(nextTasks) })
      }
    }


  }

  async loadTasks() {
    //const options = { decrypt: false }
    //this.props.userSession.getFile(TASKS_FILENAME, options)
    //.then((content) => {
    //  if(content) {
    //    const tasks = JSON.parse(content)
    //    this.setState({tasks})
    //  } 
    //})

    var incompleteTodos = await Testing.fetchList({
      completed: false
    });
    var completeTodos = await Testing.fetchList({
      completed: true
    })
    var allTodos = await Testing.fetchList({
    })
    this.setState({
      pending: incompleteTodos, 
      completed: completeTodos,
      tasks: allTodos
    })

    console.log(incompleteTodos);
    console.log(completeTodos);
    console.log(allTodos);
    
  }

  saveTasks(tasks) {
    const options = { encrypt: false }
    this.props.userSession.putFile(TASKS_FILENAME, JSON.stringify(tasks), options)
    .finally(() => {
      if(window.location.search) {
        window.history.pushState(null, "", window.location.href.split("?")[0])
      }
    })
  }

  handleChange(event) {
    this.setState({value: event.target.value});
   }

  async removeTask(e) {
    e.preventDefault()
    const deletedID = this.state.tasks[e.target.dataset.index]._id
    const todo = await Testing.findById({deletedID});
    todo.destroy(); //delete it from radiks-server

    //const tasks = remove(e.target.dataset.index, this.state)
    //this.setState({ tasks }) // remove it from the current state
    this.loadTasks()
    //this.saveTasks(tasks)
  }

  async addTask(e) {
    e.preventDefault()
    //const tasks = add(this.state)
    //this.setState({value: '', tasks})
    //this.saveTasks(tasks)
    const todo = new Testing({task: "Please work", completed: true, project: "Home"});
    await todo.save();
    //var incompleteTodos = await Testing.fetchList({
    //  completed: false
    //});
    //console.log(incompleteTodos)
    //const task = this.state.value
    //this.state.pending.push(task)
    //const tasks = this.state.tasks
    //const todo = new Testing({task: {task}, completed: false});
   // tasks.push(todo)
    //await todo.save();
    this.setState({value: ''})
    this.loadTasks();
    
    //this.setState({value: ''})
    //loadTasks()

    //this.setState({tasks: incompleteTodos})
    //const del = await Todo.findById('150685ad0529-487a-978d-8300a16241f6');
    //del.destroy();
  }

  async checkTask(e) {
    const changeID = this.state.tasks[e.target.dataset.index]._id
    const todo = await Testing.findById({changeID})
    const updatedStatus = {
      completed: !this.state.completed,
    }
    todo.update(updatedStatus);
    await todo.save();
    //const tasks = check(e.target.dataset.index, this.state)
    //this.setState({ tasks })
    this.loadTasks()
  }

  signOut(e) {
    e.preventDefault()
    this.props.userSession.signUserOut()
    window.location = '/'
  }



  render() {

    const username = this.props.userSession.loadUserData().username
    return (
      <div className="Dashboard">
      <NavBar username={username} signOut={this.signOut}/>
        <div className="row justify-content-md-center">
          <h1 className="user-info">
            <small>
              {username}'s to-dos
            </small>
          </h1>
        </div>
        <br></br>
        <div className="row">
          <div className="col-9">
            <div className="tab-content" id="v-pills-tabContent">
              <div className="tab-pane fade show active" id="v-pills-all" role="tabpanel" aria-labelledby="v-pills-all-tab">
                <div className="row justify-content-center">
                    <div
                      id="addTask"
                      className="frame"
                      style={{borderColor: '#f8f9fa'}}
                    >
                      <form onSubmit={this.addTask} className="input-group">
                        <input
                          className="form-control"
                          type="text"
                          onChange={this.handleChange}
                          value={this.state.value}
                          required
                          placeholder="Write a to-do..."
                          autoFocus={true}
                        />
                        <div className="input-group-append">
                          <input type="submit" className="btn btn-primary" value="Add task"/>
                        </div>
                      </form>
                    </div>
                  </div>
                  <br></br>
                  <div className="row justify-content-center">
                    <ul className="nav nav-pills nav-fill" role="tablist">
                      <li className="nav-item">
                        <a className="nav-link active" data-toggle="pill"href="#pills-all">All Tasks</a>
                      </li>
                      <li className="nav-item">
                        <a className="nav-link" data-toggle="pill" href="#pills-pending">Pending</a>
                      </li>
                      <li className="nav-item">
                        <a className="nav-link" data-toggle="pill" href="#pills-completed">Completed</a>
                      </li>
                    </ul>
                  </div>
                  <br></br>
                  <div className="tab-content">
                    <div class="tab-pane fade active show" id="pills-all" role="tabpanel" aria-labelledby="pills-all-tab">
                      <div className="row justify-content-center">
                        <div className="frame">
                          {this.state.tasks.map((task, i) =>
                            <ul key={i}>
                              <div className="row">
                                <input type="checkbox" className="form-check-input" data-index={i} onClick={this.checkTask} checked={task[1]? true : false}></input>
                                <div className="col">
                                  <span className="input-group-text">
                                    <div className="task">
                                      {task.attrs[1]? <s>{task.attrs[0]}</s> : task.attrs[0]}
                                    </div> 
                                    <div className="delete">
                                      <button className="btn btn-primary" data-index={i} onClick={this.removeTask}>X</button>
                                    </div>
                                  </span>
                                </div>
                              </div>
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                    <div class="tab-pane fade" id="pills-pending" role="tabpanel" aria-labelledby="pills-pending-tab">                   
                      <div className="row justify-content-center">
                          <div className="frame">
                            {this.state.pending.map((task, i) =>
                              <ul key={i}>
                                <div className="row">
                                  <input type="checkbox" className="form-check-input" data-index={i} onClick={this.checkTask} checked={task[1]? true : false}></input>
                                  <div className="col">
                                    <span className="input-group-text">
                                      <div className="task">
                                        {task.attrs[1]? <s>{task.attrs[0]}</s> : task.attrs[0]}
                                      </div> 
                                      <div className="delete">
                                        <button className="btn btn-primary" data-index={i} onClick={this.removeTask}>X</button>
                                      </div>
                                    </span>
                                  </div>
                                </div>
                              </ul>
                            )}
                          </div>
                        </div>    
                    </div>
                    <div class="tab-pane fade" id="pills-completed" role="tabpanel" aria-labelledby="pills-completed-tab">                   
                      <div className="row justify-content-center">
                          <div className="frame">
                            {this.state.completed.map((task, i) =>
                              <ul key={i}>
                                <div className="row">
                                  <input type="checkbox" className="form-check-input" data-index={i} onClick={this.checkTask} checked={task[1]? true : false}></input>
                                  <div className="col">
                                    <span className="input-group-text">
                                      <div className="task">
                                        {task.attrs[1]? <s>{task.attrs[0]}</s> : task.attrs[0]}
                                      </div> 
                                      <div className="delete">
                                        <button className="btn btn-primary" data-index={i} onClick={this.removeTask}>X</button>
                                      </div>
                                    </span>
                                  </div>
                                </div>
                              </ul>
                            )}
                          </div>
                        </div>    
                    </div>
                  </div>
                  
              
              </div>
              <div className="tab-pane fade" id="v-pills-profile" role="tabpanel" aria-labelledby="v-pills-profile-tab">Profile</div>
              <div className="tab-pane fade" id="v-pills-add" role="tabpanel" aria-labelledby="v-pills-add-tab">Add</div>
              <div className="tab-pane fade" id="v-pills-messages" role="tabpanel" aria-labelledby="v-pills-messages-tab">Messages<div>
            </div>
          </div>
        </div>  
      </div>
      </div>
      </div>

    );
  }
}

// Made this a default prop (instead of using this.userSession) so a dummy userSession
// can be passed in for testing purposes
Dashboard.defaultProps = {
  userSession: new UserSession(appConfig)
};

export default Dashboard