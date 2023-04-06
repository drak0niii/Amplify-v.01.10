import { usePostAiTextMutation } from "@/state/api";
import React, { useState, useEffect } from "react";
import MessageFormUI from "./MessageFormUI";
import axios from "axios";

const Ai = ({ props, activeChat }) => {
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState("");
  const [recording, setRecording] = useState(false);
  const [preview, setPreview] = useState("");
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [trigger] = usePostAiTextMutation();

  const handleChange = (e) => setMessage(e.target.value);

  const handleSubmit = async (transcription) => {
    if (submitDisabled) return;
  
    const date = new Date()
      .toISOString()
      .replace("T", " ")
      .replace("Z", `${Math.floor(Math.random() * 1000)}+00:00`);
    let at = [];
    if (attachment instanceof Blob) {
      at.push({ blob: attachment, file: "recording.wav" });
    } else {
      at = attachment ? [{ blob: attachment, file: attachment.name }] : [];
    }
    const form = {
      attachments: [],
      created: date,
      sender_username: props.username,
      text: transcription || message,
      activeChatId: activeChat.id,
    };
  
    if (form.text.toLowerCase().includes("check the lotto numbers")) {
      await runPythonScript(); // Await the result of runPythonScript
      
    }

    props.onSubmit(form);
    trigger(form);
    setAttachment("");
    setPreview("");
    setMessage("");

  };

  const startRecording = () => {
    setSubmitDisabled(true);
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const mimeType = 'audio/webm; codecs=opus'; // Explicitly set the MIME type
        const mediaRecorder = new MediaRecorder(stream, { mimeType }); // Pass the mimeType to the MediaRecorder

        const audioChunks = [];

        mediaRecorder.addEventListener("dataavailable", (event) => {
          audioChunks.push(event.data);
        });

        mediaRecorder.addEventListener("stop", async () => {
          stream.getTracks().forEach(track => track.stop()); // Stop the audio stream

          const audioBlob = new Blob(audioChunks);
          const audioUrl = URL.createObjectURL(audioBlob);

          await transcribeAudio(audioBlob);

          
          setRecording(false);
          setSubmitDisabled(false);
          //setPreview(audioUrl);
          //setAttachment(audioBlob);
          //setMessage("Recording submitted");
          //setAutoSubmit(true);
        });

        mediaRecorder.start();
        setRecording(true);
        setTimeout(() => {
          mediaRecorder.stop();
        }, 10000);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const runPythonScript = async () => {
    try {
      const response = await axios.post("http://localhost:5000/run_script");
      console.log("Script output:", response.data.output);
  
      // Create a new form object with the script output
      const date = new Date()
        .toISOString()
        .replace("T", " ")
        .replace("Z", `${Math.floor(Math.random() * 1000)}+00:00`);
      const outputForm = {
        attachments: [],
        created: date,
        sender_username: props.username,
        text: `Okie, there it is: ${response.data.output}`,
        activeChatId: activeChat.id,
      };
  
      // Submit the script output as a message
      props.onSubmit(outputForm);
      trigger(outputForm);
    } catch (error) {
      console.error("Error running script:", error);
    }
  };
  

  useEffect(() => {
    if (recording) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const remaining = 10 - Math.floor((Date.now() - startTime) / 1000);
        setMessage(`Recording... ${remaining} seconds remaining`);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [recording]);

 

  const transcribeAudio = async (audioBlob) => {
    const apiKey = "xxx"; // Replace with your OpenAI API key

    const formData = new FormData();
    formData.append("file", audioBlob, "recording.wav");
    formData.append("model", "whisper-1"); // Add the model parameter

    try {
      const response = await axios.post("https://api.openai.com/v1/audio/transcriptions", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${apiKey}`,
        },
      });
      console.log('API response:', response); // Log the API response

      if (response.data && response.data.text) {
        setTranscription(response.data.text);
        setMessage(`Transcription: ${response.data.text}`); // Update the message with the transcription
        handleSubmit(response.data.text); // Call handleSubmit with the transcription
      } else {
        setTranscription("Transcription unavailable");
        setMessage("Transcription unavailable"); // Update the message with an unavailable message
        handleSubmit("Transcription unavailable"); // Call handleSubmit with an unavailable message
      }
    } catch (error) {
      console.error(error);
      setTranscription("Error transcribing audio");
      setMessage("Error transcribing audio"); // Update the message with an error message
    }
  };

  return (
    <MessageFormUI
      setAttachment={setAttachment}
      message={message}
      handleChange={handleChange}
      handleSubmit={handleSubmit}
      recording={recording}
      startRecording={startRecording}
      preview={preview}
      submitDisabled={submitDisabled}
    />
  );
};

export default Ai;





















