import React, { useEffect, useState } from "react";
import { ProgressBar, Jumbotron, Button, Form } from "react-bootstrap";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const chunkSize = 1048576 * 10;

function App() {
  const [showProgress, setShowProgress] = useState(false);
  const [counter, setCounter] = useState(1);
  const [fileToBeUpload, setFileToBeUpload] = useState({});
  const [beginingOfTheChunk, setBeginingOfTheChunk] = useState(0);
  const [endOfTheChunk, setEndOfTheChunk] = useState(chunkSize);
  const [progress, setProgress] = useState(0);
  const [fileGuid, setFileGuid] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [fId, setFId] = useState("");
  const [chunkCount, setChunkCount] = useState(0);
  const [fName, setFName] = useState(0);



  const progressInstance = (
    <ProgressBar animated now={progress} label={`${progress.toFixed(3)}%`} />
  );

  useEffect(() => {
    if (fileSize > 0) {
      fileUpload(counter);
      console.log(counter);
    }
  }, [fileToBeUpload, progress]);

  const getFileContext = (e) => {
    resetChunkProperties();
    const _file = e.target.files[0];
    setFileSize(_file.size);

    const _totalCount =
      _file.size % chunkSize == 0
        ? _file.size / chunkSize
        : Math.floor(_file.size / chunkSize) + 1; // Total count of chunks will have been upload to finish the file
    setChunkCount(_totalCount);

    setFileToBeUpload(_file);
    const _fileID = uuidv4() + "." + _file.name.split(".").pop();


    const fId1 = uuidv4();
    const fName1 = _file.name;


    setFileGuid(_fileID);
    setFId(fId1);
    setFName(fName1);
  };

  const fileUpload = () => {
    setCounter(counter + 1);
    if (counter <= chunkCount) {
      var chunk = fileToBeUpload.slice(beginingOfTheChunk, endOfTheChunk);
      uploadChunk(chunk);
    }
  };

  const uploadChunk = async (chunk) => {
    try {
      var formData = new FormData();
      formData.append("file1", chunk);
      const response1 = await axios.post(
        "http://202.78.227.81:30359/api/Files/large-file-stream",
        formData,
        {
          params: {
            fileName: fName ,
            idFolder: fId,
            num: counter 
          },
          headers: { "Content-Type": "multipart/form-data" },
        }
      );


      const data = response1.data;
      if (data.isSuccess) {
        setBeginingOfTheChunk(endOfTheChunk);
        setEndOfTheChunk(endOfTheChunk + chunkSize);
        if (counter == chunkCount) {
          console.log("Process is complete, counter", counter);
          await uploadCompleted();
        } else {
          var percentage = (counter / chunkCount) * 100;
          setProgress(percentage);
        }
      } else { 
        console.log("Error Occurred:", data.errorMessage);
      }
    } catch (error) {
      debugger;
      console.log("error", error);
    }
  };

  const uploadCompleted = async () => {
    var formData = new FormData();
    formData.append("fileName", fileGuid);

    const response = await axios.post(
      "http://202.78.227.81:30359/api/Files/large-file-stream-complete",
      {},
      {
        params: {
          fileName: fName,
          idFolder: fId
        },
        data: formData,
      }
    );

    const data = response.data;
    if (data.isSuccess) {
      setProgress(100);
    }
  };

  const resetChunkProperties = () => {
    setShowProgress(true);
    setProgress(0);
    setCounter(1);
    setBeginingOfTheChunk(0);
    setEndOfTheChunk(chunkSize);
  };

  const DemoSendApi = async (e) => {
    const _file = e.target.files[0];

    var splitFileName = _file.name.split(".");
    var typeFile = "."+splitFileName.pop();
    var fId = uuidv4()

    const _totalCount =
      _file.size % chunkSize == 0
        ? _file.size / chunkSize
        : Math.floor(_file.size / chunkSize) + 1;

    var begin = 0;
    var end = chunkSize;

    console.log(_totalCount)
    var i = 1 ;
    do {
     
      var chunk = _file.slice(begin, end);
     
      var formData = new FormData();
      formData.append("file1", chunk);
      axios.post(
        "http://202.78.227.81:30359/api/Files/large-file-stream",
        formData,
        {
          params: {
            fileName:  _file.name,
            idFolder: fId,
            num: i
          },
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      begin = end;
      end = end+chunkSize;
      i++;
    } while (i <= _totalCount);


      await axios.post(
      "http://202.78.227.81:30359/api/Files/large-file-stream-complete",
      {},
      {
        params: {
          fileName: _file.name,
          idFolder: fId
        },
      }
    );
  };


  const DemoSendApiV1 = async (e) => {
    const _file = e.target.files[0];
    var splitFileName = _file.name.split(".");
    var typeFile = "."+splitFileName.pop();
    var fId = uuidv4()
    const _totalCount =
      _file.size % chunkSize == 0
        ? _file.size / chunkSize
        : Math.floor(_file.size / chunkSize) + 1;
    var begin = 0;
    var end = chunkSize;
    console.log(_totalCount)
    var i = 1 ;
    var chunks = [];
    do {
      var chunk = _file.slice(begin, end);
      chunks.push(chunk);    
      begin = end;
      end = end+chunkSize;
      i++;
    } while (i <= _totalCount);
    const promises = chunks.map((chunk,i)=>{
      var formData = new FormData();
      formData.append("file1", chunk);
      return axios.post(
        "http://202.78.227.81:30359/api/Files/large-file-stream",
        formData,
        {
          params: {
            fileName:  _file.name,
            idFolder: fId,
            num: i
          },
          headers: { "Content-Type": "multipart/form-data" },
        }
      )
      .then(rp => console.log(`Chunk ${i + 1} sent with status ${rp.status}`));      
    })
    Promise.all(promises).then(async () => {
      await axios.post(
        "http://202.78.227.81:30359/api/Files/large-file-stream-complete",
        {},
        {
          params: {
            fileName: _file.name,
            idFolder: fId
          },
        }
      );
     }).catch(err => console.log(err));
  };

  const uploadFile = async (e) =>{
    const _file = e.target.files[0];
    var formData = new FormData();
      formData.append("file1", _file);
    const response = await axios.post(
      "http://localhost:5176/api/Files/large-file-stream",
      formData,
      {
        params: {
          fileName:  _file.name,
          idFolder: "4e64e0012a6d4b3596a9ce293ee382d9",
          num: 1
        }
      }
    );
    const data = response.data;
    console.log(data);
  }

  return (
    <Jumbotron>
      <Form>
        <Form.Group>
          <Form.File
            id="exampleFormControlFile1"
            onChange={DemoSendApiV1}
            label="Example file input"
          />
        </Form.Group>
        <Form.Group style={{ display: showProgress ? "block" : "none" }}>
          {progressInstance}
        </Form.Group>
      </Form>
    </Jumbotron>
  );
}

export default App;
