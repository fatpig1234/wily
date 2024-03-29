import React from 'react';
import { Text, View, TouchableOpacity, TextInput, Image, StyleSheet, Alert } from 'react-native';
import * as Permissions from 'expo-permissions';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as firebase from 'firebase';
import db from '../config'

export default class TransactionScreen extends React.Component {
    constructor(){
      super();
      this.state = {
        hasCameraPermissions: null,
        scanned: false,
        scannedBookId: '',
        scannedStudentId:'',
        buttonState: 'normal',
        transactionMessage:''
      }
    }

    getCameraPermissions = async (id) =>{
      const {status} = await Permissions.askAsync(Permissions.CAMERA);
      
      this.setState({
        /*status === "granted" is true when user has granted permission
          status === "granted" is false when user has not granted the permission
        */
        hasCameraPermissions: status === "granted",
        buttonState: id,
        scanned: false
      });
    }

    handleBarCodeScanned = async({type, data})=>{
      const {buttonState} = this.state

      if(buttonState==="BookId"){
        this.setState({
          scanned: true,
          scannedBookId: data,
          buttonState: 'normal'
        });
      }
      else if(buttonState==="StudentId"){
        this.setState({
          scanned: true,
          scannedStudentId: data,
          buttonState: 'normal'
        });
      }
      
    }
     
    initiateBookIssue=async()=>{
      db.collection("transactions").add({
        'stId':this.state.scannedStudentId,
        'bookId':this.state.scannedBookId,
        'date':firebase.firestore.Timestamp.now().toDate(),
        'transactionType':"issue"
      })

        db.collection("books").doc(this.state.scannedBookId).update({
          'bookAvailability': false
        })

        db.collection("students").doc(this.state.scannedStudentId).update({
          'noOfBookIssued': firebase.firestore.FieldValue.increment(1)
        })
        Alert.alert("Book issued")
        this.setState({
          scannedBookId:'',
          scannedStudentId:''
        })
    }

    initiateBookReturn=async()=>{
      db.collection("transactions").add({
        'stId':this.state.scannedStudentId,
        'bookId':this.state.scannedBookId,
        'date':firebase.firestore.Timestamp.now().toDate(),
        'transactionType':"return"
      })

        db.collection("books").doc(this.state.scannedBookId).update({
          'bookAvailability': true
        })

        db.collection("students").doc(this.state.scannedStudentId).update({
          'noOfBookIssued': firebase.firestore.FieldValue.increment(-1)
        })
        Alert.alert("Book returned")
        this.setState({
          scannedBookId:'',
          scannedStudentId:''
        })
    }


    handleTransaction=async()=>{
      var transactionMessage = null
      db.collection("books").doc(this.state.scannedBookId).get()
      .then((doc)=>{
        var book=doc.data()
        if(book.bookAvailability){
          this.initiateBookIssue()
          transactionMessage="book issued"

         
        }
        else{ this.initiateBookReturn()
          transactionMessage="book returned"

        }
      })
      this.setState({transactionMessage:transactionMessage})
    }

    render() {
      const hasCameraPermissions = this.state.hasCameraPermissions;
      const scanned = this.state.scanned;
      const buttonState = this.state.buttonState;

      if (buttonState !== "normal" && hasCameraPermissions){
        return(
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
            style={StyleSheet.absoluteFillObject}
          />
        );
      }

      else if (buttonState === "normal"){
        return(
          <View style={styles.container}>
            <View>
              <Image
                source={require("../assets/booklogo.jpg")}
                style={{width:200, height: 200}}/>
              <Text style={{textAlign: 'center', fontSize: 30}}>Wily</Text>
            </View>
            <View style={styles.inputView}>
            <TextInput 
              style={styles.inputBox}
              placeholder="Book Id"
              value={this.state.scannedBookId}/>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={()=>{
                this.getCameraPermissions("BookId")
              }}>
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
            </View>
            <View style={styles.inputView}>
            <TextInput 
              style={styles.inputBox}
              placeholder="Student Id"
              value={this.state.scannedStudentId}/>
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={()=>{
                this.getCameraPermissions("StudentId")
              }}>
              <Text style={styles.buttonText}>Scan</Text>
            </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.submitButton}
          onPress={async()=>{var transactionMessage=await this.handleTransaction()}}  >
              <Text style={styles.submitButtonText}>submit</Text></TouchableOpacity>
          </View>
        );
      }
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
    displayText:{
      fontSize: 15,
      textDecorationLine: 'underline'
    },
    scanButton:{
      backgroundColor: '#2196F3',
      padding: 10,
      margin: 10
    },
    buttonText:{
      fontSize: 15,
      textAlign: 'center',
      marginTop: 10
    },
    inputView:{
      flexDirection: 'row',
      margin: 20
    },
    inputBox:{
      width: 200,
      height: 40,
      borderWidth: 1.5,
      borderRightWidth: 0,
      fontSize: 20
    },
    scanButton:{
      backgroundColor: '#66BB6A',
      width: 50,
      borderWidth: 1.5,
      borderLeftWidth: 0

    },
    submitButton:{
      backgroundColor: 'yellow',
      width: 100,
      borderWidth: 1.5,
      borderLeftWidth: 0,
      height:15
      
    },
    submitButtonText:{
      color: 'green',
      textAlign:'center',
      fontSize:25,
      fontWeight:'bold',
      padding:10

    }

  });