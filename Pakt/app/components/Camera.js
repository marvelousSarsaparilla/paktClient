import React, {
  Component,
  Dimensions,
  StyleSheet,
  Text,
  View,
  Modal,
  ListView,
  Image,
  TouchableHighlight,
} from 'react-native';

import RNCamera from 'react-native-camera';

import PaktListItem from './PaktListItem';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
  },
  capture: {
    flex: 0,
    backgroundColor: '#fff',
    borderRadius: 5,
    color: '#000',
    padding: 10,
    margin: 40,
  },
  cameraIconContainer: {
    flex: 1,
    marginBottom: 50,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cameraIcon: {
    width: 100,
    height: 100,
  },
});

class Camera extends Component {
  constructor(props) {
    super(props);
    this.state = { visible: false, transparent: true,
      animated: true, cameraType: RNCamera.constants.Type.back };
  }

  setModalVisible(visible) {
    this.setState({ visible: visible });
  }

  takePicture() {
    this.camera.capture()
    .then((picture) => {
      this.setState({ picture });
      this.setModalVisible(true);
    })
    .catch(err => console.error(err));
  }

  sendPicture(paktId) {
    const userId = this.props.user.users.currentUser.id;
    this.props.sendPictureToS3(this.state.picture, paktId, userId);
    this.setModalVisible(false);
  }

  switchCamera() {
    const state = this.state;
    state.cameraType = state.cameraType === RNCamera.constants.Type.back ? RNCamera.constants.Type.front : RNCamera.constants.Type.back;
    this.setState(state);
  }

  render() {

    const modalBackgroundStyle = {
      backgroundColor: this.state.transparent ? 'rgba(0, 0, 0, 0.5)' : '#f5fcff',
    };
    const innerContainerTransparentStyle = this.state.transparent
      ? { backgroundColor: '#fff', padding: 20 }
      : null;

    let dataSource = new ListView.DataSource({
      rowHasChanged: (row1, row2) => row1 !== row2,
    });

    // filter out pakts that have a picture uploaded today already
    const paktsWithoutProof = this.props.pakts.filter((pakt) =>
      !pakt.Pakt_User.picToday &&
      pakt.Pakt_User.accepted &&
      pakt.Pakt_User.win === null);

    dataSource = dataSource.cloneWithRows(paktsWithoutProof);

    return (
      <View style={styles.container}>
        <RNCamera
          ref={(cam) => {
            this.camera = cam;
          }}
          style={styles.preview}
          aspect={RNCamera.constants.Aspect.fill}
          captureQuality={'medium'}
          type={this.state.cameraType}
        >
          <View style={styles.cameraIconContainer}>
            <TouchableHighlight onPress={this.switchCamera.bind(this)}>
              <Image source={ require('../assets/img/arrow_clockwise.png') }
                style={styles.cameraIcon} />
            </TouchableHighlight>

            <TouchableHighlight onPress={this.takePicture.bind(this)}>
              <Image source={ require('../assets/img/camera.png') }
                style={styles.cameraIcon} />
            </TouchableHighlight>
          </View>

        </RNCamera>
        <Modal
          animated={this.state.animated}
          transparent={this.state.transparent}
          visible={this.state.visible}>
          <View style={[styles.container, modalBackgroundStyle]}>
            <View style={[styles.innerContainer, innerContainerTransparentStyle]}>
              <Text onPress={this.setModalVisible.bind(this, false)}>
                Back
              </Text>
              <ListView
                dataSource={dataSource}
                renderRow={(rowData) => <PaktListItem pakt={rowData} onPaktClick={this.sendPicture.bind(this, rowData.id)} />}
                style={styles.listView}
              />
              {(paktsWithoutProof.length === 0) ? <Text>{"\n"}None of your Pakts need proof right now...</Text> : null}
            </View>
          </View>
        </Modal>
      </View>
    );
  }
}

module.exports = Camera;
