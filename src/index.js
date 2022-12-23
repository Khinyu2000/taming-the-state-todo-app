import React from 'react';
import ReactDOM from 'react-dom/client';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import { Provider, connect } from 'react-redux';
import { schema, normalize } from 'normalizr';
import { createLogger } from 'redux-logger';
import { v4 as uuid } from 'uuid';
import createSagaMiddleware from '@redux-saga/core';
import { put, takeEvery } from 'redux-saga/effects';
import { delay } from 'redux-saga/effects'

import './index.css';
// import App from './App';
import reportWebVitals from './reportWebVitals';

const TODO_TOGGLE = "TODO_TOGGLE";
const TODO_ADD = "TODO_ADD";
const FILTER_SET = "FILTER_SET";
const NOTIFICATION_HIDE = "NOTIFICATION_HIDE";
const TODO_ADD_WITH_NOTIFICATION = "TODO_ADD_WITH_NOTIFICATION";

const VISIBILITY_FILERS = {
  SHOW_COMPLETED: item => item.completed,
  SHOW_INCOMPLETED: item => !item.completed,
  SHOW_ALL:  item => true,
}


const todos = [
  { id: '1', name: 'Hands On: Redux Standalone with advanced Actions' },
  { id: '2', name: 'Hands On: Redux Standalone with advanced Reducers' },
  { id: '3', name: 'Hands On: Bootstrap App with Redux' },
  { id: '4', name: 'Hands On: Naive Todo with React and Redux' },
  { id: '5', name: 'Hands On: Sophisticated Todo with React and Redux' },
  { id: '6', name: 'Hands On: Connecting State Everywhere' },
  { id: '7', name: 'Hands On: Todo with advanced Redux' },
  { id: '8', name: 'Hands On: Todo but more Features' },
  { id: '9', name: 'Hands On: Todo with Notifications' },
  { id: '10', name: 'Hands On: Hacker News with Redux' },
];

const todoSchema = new schema.Entity('todo');
const normalizedTodos = normalize(todos, [todoSchema])
const initialTodoState = {
  entities: normalizedTodos.entities.todo,
  ids: normalizedTodos.result,
}

function todoReducer(state = initialTodoState, action) {
  switch(action.type) {
    case TODO_ADD: {
      return applyAddTodo(state, action);
    }
    case TODO_TOGGLE: {
      return applyToggleTodo(state, action);
    }
    default: return state;
  }
}

function filterReducer(state = "SHOW_ALL", action) {
  switch(action.type) {
    case FILTER_SET: {
      return applySetFilter(state, action);
    }
    default: return state;
  }
}

function notificationReducer(state = {}, action) {
  switch(action.type) {
    case TODO_ADD: {
      return applySetNotifyAboutAddTodo(state, action);
    }
    case NOTIFICATION_HIDE: {
      return applyRemoveNotification(state, action);
    }
    default: return state;
  }
}

function applySetNotifyAboutAddTodo(state, action) {
  const { id, name } = action.todo;
  return { ...state,  [id]: "Todo created at: "+name};
}

function applyRemoveNotification(state, action) {
  const {
    [action.id]: notificationToremove,
    ...restNotifications
  } = state;
  return restNotifications;
}


function applyToggleTodo(state, action) {
  const id = action.todo.id;
  const todo = state.entities[id];
  const toggledTodo = { ...todo, completed : !todo.completed };
  const entities = { ...state.entities, [id]: toggledTodo };
  return { ...state, entities };
}

function applyAddTodo(state, action) {
  const todo = { ...action.todo, completed: false };
  const entities = { ...state.entities, [todo.id]: todo };
  const ids = [ ...state.ids, action.todo.id]
  return { ...state, entities, ids };

}

function applySetFilter(state, action) {
  return action.filter;
}

const rootReducer = combineReducers({
  todoState: todoReducer,
  filterState: filterReducer,
  notificationState: notificationReducer,
});

const logger = createLogger();
const saga = createSagaMiddleware();

const store = createStore(
  rootReducer, 
  undefined,
  applyMiddleware(saga, logger),
)

saga.run(watchAddTodoWithNotification);

function TodoItem({ todo, onToggleTodo }) {
  const { id, name, completed } = todo;
  return (
    <div>
      {name}
      <button
        type="button"
        onClick={() => onToggleTodo(id)}
      >
        {completed ? "Incomplete" : "Complete"}
      </button>
    </div>
  );
}

function TodoList({ todoAsIds }) {
  return (
    <div>
      {todoAsIds.map(todoId =>
        <ConnectedTodoItem 
          key={todoId}
          todoId={todoId}
        />
      )}
    </div>
  );
}

class TodoCreate extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
    }
    this.onChangeName = this.onChangeName.bind(this);
    this.onCreateTodo = this.onCreateTodo.bind(this);

  }

  onChangeName(event) {
    const { value } = event.target;
    this.setState({
      value: value,
    })
  }

  onCreateTodo(event) {
    event.preventDefault();
    this.props.onAddTodo(this.state.value);
    this.setState({
      value: '',
    })
  }


  render() {
    return (
      <form action="" onSubmit={this.onCreateTodo}>
        <input 
          type="text" 
          value={this.state.value}
          onChange={this.onChangeName}
        />
        <button
          type="submit"
        >
          Add
        </button>
      </form>
    );
  }
}

function Filter({ onSetFilter }) {
  return (
    <div>
      <button
        type="button"
        onClick={() => onSetFilter("SHOW_ALL")}
      >
        All
      </button>
      <button
        type="button"
        onClick={() => onSetFilter("SHOW_COMPLETED")}
      >
        COMPLETED
      </button>
      <button
        type="button"
        onClick={() => onSetFilter("SHOW_INCOMPLETED")}
      >
        INCOMPLETED
      </button>
    </div>
  );
}

function Notifications({ notifications }) {
  return (
    <div>
      {notifications.map(note => 
        <div key={note}>{note}</div>
      )}
    </div>
  );

}

function TodoApp() {
  return (
    <div>
      <ConnectedTodoFilter />
      <ConnectedTodoCreate />
      <ConnectedTodoList />
      <ConnedtedTodoNotifications />
    </div>
  );
}

function mapStateToPropsItem(state, props) {
  return {
    todo: getTodo(state, props.todoId),
  }
}

function mapDispatchToPropsItem(dispatch) {
  return {
    onToggleTodo: id => dispatch(doToggleTodo(id)),
  }
}

function mapStateToPropsList(state) {
  return {
    todoAsIds: getTodosAsIds(state),
  }
}

function mapDispatchToPropsCreate(dispatch) {
  return {
    onAddTodo: name => dispatch(doAddTodoWithNotification(uuid(), name)),
    }
}

function mapDispatchToPropsFilter(dispatch) {
  return {
    onSetFilter: filter => dispatch(doSetFilter(filter)),
  }
}

function mapStateToPropsNotifications(state) {
  return {
    notifications: getNotifications(state),
  }
}

function getTodosAsIds(state) {
  return state.todoState.ids
    .map(id => state.todoState.entities[id])
    .filter(VISIBILITY_FILERS[state.filterState])
    .map(todo => todo.id);
  ;
}

function getTodo(state, todoId) {
  return state.todoState.entities[todoId];
}

function getNotifications(state) {
  return getArrayOfObject(state.notificationState);
}

function getArrayOfObject(object) {
  return Object.keys(object).map(key => object[key]);
}

function* watchAddTodoWithNotification() {
  yield takeEvery(TODO_ADD_WITH_NOTIFICATION, handleAddTodoWithNotification)
}

function* handleAddTodoWithNotification(action) {
  const { todo } = action;
  const { id, name } = todo;
  yield put(doAddTodo(id, name));
  yield delay(5000);
  yield put(doHideNotification(id));

}

function doToggleTodo(id) {
  return {
    type: TODO_TOGGLE,
    todo: { id },
  }
}

function doAddTodo(id, name) {
  return {
    type: TODO_ADD,
    todo: { id, name },
  }
}

function doSetFilter(filter) {
  return {
    type: FILTER_SET,
    filter,
  }
}

function doHideNotification(id) {
  return {
    type: NOTIFICATION_HIDE,
    id,
  }
}

function doAddTodoWithNotification(id, name) {
  return {
    type: TODO_ADD_WITH_NOTIFICATION,
    todo: { id, name },
  }
}

const ConnectedTodoItem = connect(mapStateToPropsItem, mapDispatchToPropsItem)(TodoItem);
const ConnectedTodoList = connect(mapStateToPropsList)(TodoList);
const ConnectedTodoCreate = connect(null, mapDispatchToPropsCreate)(TodoCreate);
const ConnectedTodoFilter = connect(null, mapDispatchToPropsFilter)(Filter);
const ConnedtedTodoNotifications = connect(mapStateToPropsNotifications)(Notifications);


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <TodoApp />
    </Provider>
  </React.StrictMode>
);



// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
