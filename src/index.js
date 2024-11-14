import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import React, { useState } from "react";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { GOOGLE_CLOUD_VISION_API_KEY } from "@env";

const DetectObject = () => {
    const [imageUri, setImageUri] = useState(null);
    const [labels, setLabels] = useState([]);

    const takePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                alert('Camera permission is required to take photos.');
                return;
            }

            let result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [3, 3],
                quality: 1,
            });

            if (!result.canceled) {
                setImageUri(result.assets[0].uri);
            }
            console.log(result);
        }
        catch (err) {
            console.log("Error taking photo: ", err);
        }
    };

    const analyzeImage = async () => {
        try {
            if (!imageUri) {
                alert("Please take a photo first.");
                return;
            }

            const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_VISION_API_KEY}`;

            const base64Image = await FileSystem.readAsStringAsync(imageUri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const requestData = {
                requests: [
                    {
                        image: {
                            content: base64Image,
                        },
                        features: [
                            {
                                type: "LABEL_DETECTION",
                                maxResults: 3,
                            },
                        ],
                    },
                ],
            };

            const apiResponse = await axios.post(apiUrl, requestData);
            setLabels(apiResponse.data.responses[0].labelAnnotations);
        } catch (err) {
            console.log("Error analyzing image: ", err);
            alert("Error analyzing image. Please try again.");
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                Google Cloud Vision API
            </Text>
            {imageUri && (
                <Image
                    source={{ uri: imageUri }}
                    style={{ width: 300, height: 300 }}
                />
            )}
            <TouchableOpacity
                onPress={takePhoto}
                style={styles.button}
            >
                <Text style={styles.text}>Take a photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={analyzeImage}
                style={styles.button}
            >
                <Text style={styles.text}>Analyze photo</Text>
            </TouchableOpacity>
            {
                labels.length > 0 && (
                    <View>
                        <Text style={styles.text}>
                            Labels:
                        </Text>
                        {
                            labels.map((label) => (
                                <Text
                                    key={label.mid}
                                    style={styles.outputText}
                                >
                                    {label.description}
                                </Text>
                            ))
                        }
                    </View>
                )
            }
        </View>
    );
}

export default DetectObject;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        marginBottom: 50,
        marginTop: 100,
    },
    button: {
        backgroundColor: 'blue',
        padding: 10,
        borderRadius: 5,
        margin: 10,
    },
    text: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    outputText: {
        fontSize: 16,
        margin: 5,
    },
    label: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
    },
    outputLabel: {
        fontSize: 18,
        marginBottom: 10,
    },
});
