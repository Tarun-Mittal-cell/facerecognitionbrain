import React, { Component } from 'react';
import Navigation from './components/Navigation/Navigation';
import Logo from './components/Logo/Logo';
import './App.css';
import Rank from './components/Rank/Rank';
import Register from './components/Register/Register';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm';
import ParticlesBg from 'particles-bg'
import FaceRecognition from './components/FaceRecognition/FaceRecognition';
import SignIn from './components/SignIn/SignIn';

const particlesOptions = {
  particles: {
    number: {
      value: 30,
      density: {
        enable: true, 
        value_area: 800
      }
    }
  }
}

const returnClarifaiRequestOptions = (imageUrl) => {
  const PAT = '0c00abb445c3402789aa170e5060a41b';
    const USER_ID = 'nianjing98972';       
    const APP_ID = 'test';
    const MODEL_ID = 'face-detection';
    const IMAGE_URL = imageUrl;

    const raw = JSON.stringify({
      "user_app_id": {
          "user_id": USER_ID,
          "app_id": APP_ID
      },
      "inputs": [
          {
              "data": {
                  "image": {
                      "url": IMAGE_URL
                  }
              }
          }
      ]
  });


  const requestOptions = {
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Authorization': 'Key ' + PAT
    },
    body: raw
};
  return requestOptions
}


class App extends Component{
  constructor() {
    super();
    this.state = {
      input: '',
      imageUrl: '',
      box: {},
      route: 'sigin',
      isSignedIn: false,
      user :{
        id: '',
        name: '',
        email: '',
        entries: 0, 
        joined: ''
      }
    }
  }

  loadUser =(data) => {
    this.setState ({user: {
      id: data.id,
      name: data.name,
      email: data.email,
      entries: data.entries, 
      joined: data.joined
    }})
  }


  calculateFaceLocation = (data) => {
    const clarifaiFace = data.outputs[0].data.regions[0].region_info.bounding_box;
    const image = document.getElementById('inputimage');
    const width = Number(image.width);
    const height = Number(image.height);
    return {
      leftCol: clarifaiFace.left_col * width,
      topRow: clarifaiFace.top_row * height,
      rightCol: width - (clarifaiFace.right_col * width),
      bottomRow: height - (clarifaiFace.bottom_row * height)
    }
  }

  displayFaceBox = (box) => {
    this.setState({box: box});
  }

  onInputChange = (event) => {
    this.setState({input: event.target.value});
  }

  onButtonSubmit = () => {
    this.setState({imageUrl: this.state.input});
    
    fetch("https://api.clarifai.com/v2/models/" + 'face-detection'  + "/outputs", returnClarifaiRequestOptions(this.state.input))
    .then(response => response.json())
    .then(response => {
      if(response) {
        fetch('http://localhost:3000/image', {
          method: 'put',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            id: this.state.user.id
          })
        })
        .then(response => response.json())
        .then(count => {
          this.setState(Object.assign(this.state.user, { entries: count}))
        })
      }
      this.displayFaceBox(this.calculateFaceLocation(response))
    })
    .catch(err => console.log(err));
  }

  onRouteChange = (route) => {
    if(route === 'signout'){
      this.setState({isSignedIn: false})
    } else if(route === 'home'){
      this.setState({isSignedIn: true})
    }
    this.setState({route: route});
  }


  render() {
    const { isSignedIn, imageUrl, route, box } = this.state;
    return (
     <div className="App">
        <ParticlesBg className = 'particles' type='cobweb' 
        params={particlesOptions}
        bg={true} />
        <Navigation isSignedIn={isSignedIn} inputs onRouteChange={this.onRouteChange} />
        { route === 'home'
          ? <div>
              <Logo />
              <Rank />
              <ImageLinkForm 
              onInputChange = {this.onInputChange} 
              onButtonSubmit = {this.onButtonSubmit} 
              />
              <FaceRecognition box={box} imageUrl = {imageUrl} />
            </div>
         : (
          route === 'signin' 
          ? <SignIn onRouteChange = {this.onRouteChange}/>  
          : <Register loadUser = {this.loadUser} onRouteChange={this.onRouteChange}/> 
        )
      }
    </div>
    );
  }
}
 

export default App;
