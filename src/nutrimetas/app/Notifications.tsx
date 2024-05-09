import { Image  } from 'react-native';
import React, { useState, useEffect } from 'react';
import { showMessage } from "react-native-flash-message";


export const successfulSelection = () => {
    showMessage({
        type: "success",
        message: "Success",
        description: "You successfully selected a patient",
        backgroundColor: "#00c0f3", 
        color: "#FFFFFF", 
        icon: props => <Image source={{uri: 'https://www.iconpacks.net/icons/free-icons-6/free-blue-information-button-icon-18667.png'}} {...props} />,
        style: {
        borderRadius: 10, 
        },
    })
}

export const successfulAddition = () => {
    showMessage({
        type: "success",
        message: "Success",
        description: "Patient succesfully added",
        backgroundColor: "#6dc067", 
        color: "#FFFFFF", 
        icon: props => <Image source={{uri: 'https://www.iconpacks.net/icons/5/free-icon-green-check-mark-approval-16196.png'}} {...props} />,
        style: {
        borderRadius: 10, 
        },
    })
    }

