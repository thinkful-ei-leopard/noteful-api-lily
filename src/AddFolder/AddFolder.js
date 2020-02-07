import React from 'react'
import ApiContext from '../ApiContext'
import NotefulForm from '../NotefulForm/NotefulForm'
import config from '../config'
import { generateId } from '../notes-helpers'

import './AddFolder.css'

export default class AddFolder extends React.Component {
  state = { 
    folderName: { value: '', touched: false }
  };

  setFolderName = name => {
    this.setState ({
      folderName: { value: name, touched: true }
    })
  }

  static contextType = ApiContext;

  handleSubmit(event) {
    event.preventDefault();

    let folder = {
      id: generateId(),
      name: this.state.folderName.value
    }
  
    fetch(`${config.API_ENDPOINT}/folders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(folder)
      })
        .then(() => {
          this.context.addFolder(folder);
          this.props.history.goBack();
        })
        .catch(error => {
          console.log({error});
        })
  }

  validateFolderName = () => {
    let name = this.state.folderName.value;
    if (name.length <= 1) {
      return "Must enter a name"
    }
  }

  render() {
    return (
      <div className="AddFolder-container">
        <h2>Add a new folder</h2>
        <NotefulForm
          className="AddFolder"
          onSubmit={event => this.handleSubmit(event)}
        >
        <label htmlFor="folder-name">
          Folder name
          {this.state.folderName.touched && <p className="error"> {this.validateFolderName()} </p>}
        </label>
        <input 
          id="folder-name"
          type="text"
          placeholder="New Folder"
          value={this.state.folderName.value}
          onChange={event => this.setFolderName(event.target.value)}
        />
        <button type="submit" disabled={this.validateFolderName()}>Add Folder</button>
        </NotefulForm>
      </div>
    )
  }
}