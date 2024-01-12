import React, { useEffect, useState } from "react";
import classNames from 'classnames';
import DeleteModal from './DeleteModal';
import EditModal from './EditModal';
import StatsModal from './StatsModal';
import BookModal from './BookModal';

export const Calendar = () => {

  const google = window.google; 
  const gapi = window.gapi;

  const CLIENT_ID ="27270034872-j4k6fh3jgf1prpvftttvjgsgk7f8so49.apps.googleusercontent.com";
  const API_KEY = "AIzaSyBuTAuAsqT1g9QtpJoc-2pik21bhb9WjCA";
  const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";
  const SCOPES = "https://www.googleapis.com/auth/calendar";
  const [ accessToken, setAccessToken ]  = useState(window.localStorage.getItem("access_token"));
  const [ expiresIn, setExpiresIn ] = useState(window.localStorage.getItem("expires_in")); 

  useEffect(() => {
    if (!accessToken) {
      setAccessToken(window.localStorage.getItem('access_token'));
      setExpiresIn(window.localStorage.getItem('expires_in'));
    }
  }, [accessToken, expiresIn]);

  const RoomIDs = {
    "Local History Room": '3ecf0ad6f68abeaec4d12dc940ccfdcee973d96406adae96598d147dbf1930c3@group.calendar.google.com',
    "Art Room": 'fea143931218c9dcbe73cf9e0039cf275f4f6d3c52b6acdbc966a7152988fc42@group.calendar.google.com',
    "Study Room 1": '1f559fa14f9310b4940c3f23220406c3c840858db685fa4b98b54188d3c8445c@group.calendar.google.com',
    "Study Room 2": '006367f94fd414b400bbf6845c10e253629400e10907dce09e9ee47e7c62d746@group.calendar.google.com',
    "Study Room 3": 'a297e813fee4f4f0803f4d7cbb928519be7c9f16bd5bba8d9aff20e9cf084feb@group.calendar.google.com',
  }

  const DMLID = "1e1304c1e62c95e48b8222d2c588964dbcd94bb8f1445b134a9b4d9a6d31f23a@group.calendar.google.com";

  const [ currentEvents, setCurrentEvents ] = useState({
    "Local History Room": <div>Loading...</div>,
    "Art Room": <div>Loading...</div>,
    "Study Room 1": <div>Loading...</div>,
    "Study Room 2": <div>Loading...</div>,
    "Study Room 3": <div>Loading...</div>,
  })

  const [ DMLSessions, setDMLSessions ] = useState(
    <div>Loading...</div>
  )

  const [ inputControl, setInputControl ] = useState({
    startTime: "",
    endTime: "",
    name: "",
    number_of_people: 0,
    notes: ""
  });

  const today = new Date().toLocaleDateString();
  var [ today_month, today_day, today_year ] =today.split("/");

  if (today_day.length === 1) {
    today_day = "0" + today_day;
  }

  if (today_month.length === 1) {
    today_month = "0" + today_month;
  }

  var prevDate = window.localStorage.getItem("currentDate");
  console.log(prevDate);
  
  const [ statsControl, setStatsControl ] = useState({
    startTime: `${today_year}-${today_month}-${today_day}`,
    endTime: `${today_year}-${today_month}-${today_day}`,
  })

  const [ currentDate, setCurrentDate ] = useState(prevDate ? JSON.parse(prevDate) : {
    day: today_day,
    month: today_month,
    year: today_year,
    formatted: `${today_year}-${today_month}-${today_day}`,
  })

  const [ showModal, setShowModal ] = useState(false);
  const [ showStatsModal, setShowStatsModal ] = useState(false);
  const [ showEditModal, setShowEditModal ] = useState(false);
  const [ editId, setEditId ] = useState("");  
  const [ currentRoom, setCurrentRoom ] = useState('Art Room');
  const [ statsState, setStatsState ] = useState();
  const [ showConfirmModal, setShowConfirmModal ] = useState(false);
  const [ currentEvent , setCurrentEvent ] = useState();
  const [ showDML, setShowDML ] = useState(false);

  let gapiInited = false,
  gisInited = false,
  tokenClient; 
  
  useEffect(() => {
    //const expiryTime = new Date().getTime() + expiresIn * 1000;
    while (!gapi);
    gapiLoaded();
    gisLoaded();  
    
  }, []); 

  useEffect(() => {
    if (gapi.client && currentDate) {
    (async () => {
      var newEvents = {};
      for (var key of Object.keys(RoomIDs)) {
        var events = await listUpcomingEvents(key);
        newEvents[key] = events;        
      }
      setCurrentEvents(newEvents);
      updateDML();
    })();
    }
  }, [currentDate])


 
  function gapiLoaded() {
    
    gapi.load("client", initializeGapiClient);
    

  } 

  async function initializeGapiClient() {
    await gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });

    gapiInited = true; 

    if (accessToken && expiresIn) {
      gapi.client.setToken({
        access_token: accessToken,
        expires_in: expiresIn,
      });
      var newEvents = {};
      for (var key of Object.keys(RoomIDs)) {
        var events = await listUpcomingEvents(key);
        newEvents[key] = events;        
      }
      setCurrentEvents(newEvents);
    }
    
   
  }

  function gisLoaded() {
      tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      DISCOVERY_DOC: "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
      callback: "", // defined later
      }); 
      gisInited = true;
    
  }

  //Enables user interaction after all libraries are loaded. 

  async function handleAuthClick() {
    tokenClient.callback = async (resp) => {
      if (resp.error) {
        throw resp;
      }
      console.log(gapi.client.getToken());
      const { access_token, expires_in } = gapi.client.getToken();
      window.localStorage.setItem("access_token", access_token);
      window.localStorage.setItem("expires_in", expires_in);
      setAccessToken(access_token);
      setExpiresIn(expires_in);
      var newEvents = {};
      for (var key of Object.keys(RoomIDs)) {
        var events = await listUpcomingEvents(key);
        newEvents[key] = events;        
      }
      setCurrentEvents(newEvents);
    };
    if (!(accessToken && expiresIn)) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      tokenClient.requestAccessToken({ prompt: "consent" });
     } else {
      // Skip display of account chooser and consent dialog for an existing session.
      tokenClient.requestAccessToken({ prompt: "" });
    }
    
  } 

  //Sign out the user upon button click. 

  function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
      google.accounts.oauth2.revoke(token.access_token);
      gapi.client.setToken("");
      localStorage.clear();
      
    }
    //setAccessToken(null);
    setExpiresIn(null);
    window.location.reload();
  } 

  function parseDateTime(dateString) {
    console.log(dateString);
    var hour = Number(dateString.slice(11, 13));
    var amPm = hour >= 12 ? "p.m." : "a.m.";
    hour = hour === 0 ? 12 : hour;
    hour = hour > 12 ? hour - 12 : hour;
    var min = dateString.slice(14,16);
    return `${hour}:${min} ${amPm}`;
  }

  async function handleEdit(roomId, eventId) {
    let response;
    try {
      const request = {
        calendarId: RoomIDs[roomId],
        eventId: eventId,
      };
      response = await gapi.client.calendar.events.get(request);
    } catch (err) {
      //document.getElementById("content").innerText = err.message;
      handleAuthClick();
      return;
    }
    console.log(response);
    setInputControl({
      startTime: response.result.start.dateTime.slice(11, 16),
      endTime: response.result.end.dateTime.slice(11,16),
      name: response.result.summary ? response.result.summary : "",
      number_of_people: response.result.extendedProperties.private.number_of_people,
      notes: response.result.description ? response.result.description : "",
    })
    setCurrentRoom(roomId);
    setEditId(response.result);
    setShowEditModal(true);
  }

  async function sendEdit() {
    console.log(inputControl);
    var todaysDate = new Date();
    var startTime = `${todaysDate.getFullYear()}-${todaysDate.getMonth() + 1}-${todaysDate.getDate()}T${inputControl.startTime}:00.000`;
    var endTime = `${todaysDate.getFullYear()}-${todaysDate.getMonth() + 1}-${todaysDate.getDate()}T${inputControl.endTime}:00.000`;
    var event = {
        ...editId,
        summary: inputControl.name,
        description: inputControl.notes,
        start: {
          dateTime: startTime,
          timeZone: "America/New_York",
        },
        end: {
          dateTime: endTime,
          timeZone: "America/New_York",
        },
        extendedProperties: {
          "private": {
            number_of_people: inputControl.number_of_people,
          }
        }
    };
    var request = gapi.client.calendar.events.patch({
      resource: event,
      calendarId: RoomIDs[currentRoom],
      eventId: editId.id,
    });
    request.execute(
      async (event) => {
        var newEvents = {};
        for (var key of Object.keys(RoomIDs)) {
          var events = await listUpcomingEvents(key);
          newEvents[key] = events;        
        }
        setCurrentEvents(newEvents);
      },
        (error) => {
          handleAuthClick();
          return;
      }
    )
    setShowEditModal(false);
  }

function handleDelete() {
  var request = gapi.client.calendar.events.delete({
    calendarId: RoomIDs[currentRoom],
    eventId: currentEvent,
  });
  request.execute(
    async (event) => {
      var newEvents = {};
      for (var key of Object.keys(RoomIDs)) {
        var events = await listUpcomingEvents(key);
        newEvents[key] = events;        
      }
      setCurrentEvents(newEvents);
    },
    (error) => {
      handleAuthClick();
      return;
    }
  );
  setShowConfirmModal(false);
}

function confirmDelete(roomId, id) {  
  setCurrentRoom(roomId);
  setCurrentEvent(id);
  setShowConfirmModal(true);
}

  
  async function listUpcomingEvents(id) {    
    let current_date = `${currentDate.year}-${currentDate.month}-${currentDate.day}T00:00:00.000-05:00`;
    let end_of_day = `${currentDate.year}-${currentDate.month}-${currentDate.day}T23:59:59.000-05:00`;
  
    let response;
    try {
      const request = {
        calendarId: RoomIDs[id],
        timeMin: current_date,
        timeMax: end_of_day,
        showDeleted: false,
        singleEvents: true,
        orderBy: "startTime",
      };
      response = await gapi.client.calendar.events.list(request);
    } catch (err) {
      //document.getElementById("content").innerText = err.message;
      //handleSignoutClick();
      handleAuthClick();
      return;
    }
    const events = response.result.items;
    if (!events || events.length === 0) {
      //document.getElementById("content").innerText = "No events found.";
      return;
    }

    // Flatten to string to display
    const output = await events.map((event) => {
      if (!event.summary) {
        return <div key={event.id}>No title</div>
      }
      return (
      <div className="bg-blue-600 mt-5 ml-2 mr-2 p-2 rounded grid grid-rows-1 grid-cols-8" key={event.id}>
        <div className="col-span-8 row-start-1 col-start-1">
          <div>
            {event.summary}
          </div>
          <div>
            {parseDateTime(event.start.dateTime)} - {parseDateTime(event.end.dateTime)}
          </div>
          <div>
            {event.extendedProperties ? "Headcount: " + event.extendedProperties["private"].number_of_people : ""}
          </div>
          <div>
            {event.description ? "Notes: " + event.description : ""}
          </div>
        </div>
        <span className="col-span-1 row-start-1 col-start-8 grid grid-cols-subgrid">
        <div>
        <svg onClick={() => confirmDelete(id, event.id)} className="p-1 w-6 h-6 text-white dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z"/>
        </svg>
        </div>
        <div>
        <svg onClick={() => handleEdit(id, event.id)} className="p-1 w-6 h-6 text-white dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 20 18">
          <path d="M12.687 14.408a3.01 3.01 0 0 1-1.533.821l-3.566.713a3 3 0 0 1-3.53-3.53l.713-3.566a3.01 3.01 0 0 1 .821-1.533L10.905 2H2.167A2.169 2.169 0 0 0 0 4.167v11.666A2.169 2.169 0 0 0 2.167 18h11.666A2.169 2.169 0 0 0 16 15.833V11.1l-3.313 3.308Zm5.53-9.065.546-.546a2.518 2.518 0 0 0 0-3.56 2.576 2.576 0 0 0-3.559 0l-.547.547 3.56 3.56Z"/>
          <path d="M13.243 3.2 7.359 9.081a.5.5 0 0 0-.136.256L6.51 12.9a.5.5 0 0 0 .59.59l3.566-.713a.5.5 0 0 0 .255-.136L16.8 6.757 13.243 3.2Z"/>
        </svg>
        </div>
        
        </span>
      </div>
      )
    });
    return output;
  } 

  

  async function updateDML() {    
    const dml_today = new Date().toLocaleDateString();
    var [ dml_month, dml_day, dml_year ] = dml_today.split("/");

    const end_of_month_month = dml_month <= 11 ? dml_month + 1 : 1;
    const end_of_month_day = dml_day <= 28 ? dml_day : 28;
    const end_of_month_year = dml_month <= 11 ? dml_year : dml_year + 1;

    if (today_day.length === 1) {
      today_day = "0" + today_day;
    }

    if (today_month.length === 1) {
      today_month = "0" + today_month;
    }

    let start = `${dml_year}-${dml_month}-${dml_day}T00:00:00.000-05:00`;
    let end = `${end_of_month_year}-${end_of_month_month}-${end_of_month_day}T23:59:59.000-05:00`;
  
    let response;
    try {
      const request = {
        calendarId: DMLID,
        timeMin: start,
        timeMax: end,
        showDeleted: false,
        singleEvents: true,
        orderBy: "startTime",
      };
      response = await gapi.client.calendar.events.list(request);
    } catch (err) {
      //document.getElementById("content").innerText = err.message;
      //handleSignoutClick();
      handleAuthClick();
      return;
    }
    const events = response.result.items;
    if (!events || events.length === 0) {
      //document.getElementById("content").innerText = "No events found.";
      return;
    }

    // Flatten to string to display
    const output = await events.map((event) => {
      if (!event.summary) {
        return <div key={event.id}>No title</div>
      }
      return (
      <div className="bg-blue-600 mt-5 ml-2 mr-2 p-2 rounded grid grid-rows-1 grid-cols-8" key={event.id}>
        <div className="col-span-8 row-start-1 col-start-1">
          
          <div>
            {parseDateTime(event.start.dateTime)} - {parseDateTime(event.end.dateTime)}
          </div>
          <div>
            {`${event.start.dateTime.slice(5,7)}-${event.start.dateTime.slice(8,10)}-${event.start.dateTime.slice(0,4)}`}
          </div>
          <div>
            {event.extendedProperties ? "Headcount: " + event.extendedProperties["private"].number_of_people : "Available"}
          </div>
          <div>
            {event.description ? "Notes: " + event.description : ""}
          </div>
        </div>
        
      </div>
      )
    });
    setDMLSessions(output);
  } 

  async function getRoomStats(id) {       
    let response;
    try {
      const request = {
        calendarId: RoomIDs[id],
        timeMin: statsControl.startTime + "T00:00:00-05:00",
        timeMax: statsControl.endTime + "T23:59:59-05:00",
        showDeleted: false,
        singleEvents: true,
        orderBy: "startTime",
      };
      response = await gapi.client.calendar.events.list(request);
    } catch (err) {
      //document.getElementById("content").innerText = err.message;
      handleSignoutClick();
    }
    const events = response.result.items;
    if (!events || events.length === 0) {
      //document.getElementById("content").innerText = "No events found.";
      return {'Sessions': 0, 'People': 0};
    }
    // Flatten to string to display
    var initial = {'Sessions': 0, 'People': 0};
    const output = await events.reduce((accumulator, event) => {
      accumulator['Sessions']++;
      if (event.extendedProperties) {
        accumulator['People'] += Number(event.extendedProperties['private'].number_of_people);
      } else {
        accumulator['People'] += 1;
      }
      return accumulator;
    }, initial);
    return output;
  } 



  async function sendEvent() {
    var startTime = `${currentDate.year}-${currentDate.month}-${currentDate.day}T${inputControl.startTime}:00.000`;
    var endTime = `${currentDate.year}-${currentDate.month}-${currentDate.day}T${inputControl.endTime}:00.000`;
    var event = {
      kind: "calendar#event",
      summary: inputControl.name,
      description: inputControl.notes,
      start: {
        dateTime: startTime,
        timeZone: "America/New_York",
      },
      end: {
        dateTime: endTime,
        timeZone: "America/New_York",
      },
      extendedProperties: {
        "private": {
          number_of_people: inputControl.number_of_people,
        }
      }      
    };
    var request = gapi.client.calendar.events.insert({
      calendarId: RoomIDs[currentRoom],
      resource: event,
      sendUpdates: "all",
    });
    request.execute(
      async (event) => {
        var newEvents = {};
        for (var key of Object.keys(RoomIDs)) {
          var events = await listUpcomingEvents(key);
          newEvents[key] = events;        
        }
        setCurrentEvents(newEvents);
      },
        (error) => {
          handleSignoutClick();
      }
    )
    setShowModal(false);

      
    
}

  var addEvent = () => {
    setShowModal(true);   
    var currentTime = new Date().toLocaleTimeString()
    if (currentTime.length === 10) {
      currentTime = "0" + currentTime;
    }

    if (currentTime.slice(9,11) === 'PM') {
    
      currentTime = (Number(currentTime.slice(0,2)) + 12).toString() + currentTime.slice(2);
    }

    currentTime = currentTime.slice(0,5);
    var twoHourTime = (Number(currentTime.slice(0,2)) + 2).toString() + currentTime.slice(2,5);
    if (twoHourTime.length ===  4) {
      twoHourTime = "0" + twoHourTime;
    }

    if (new Date().getDay() >= 5) {
      if (Number(twoHourTime.slice(0,2)) >= 18) {
        twoHourTime = "18:00";
      }
    } else {
      if (Number(twoHourTime.slice(0,2) >= 20)) {
        twoHourTime = "20:00";
      }
    }
    setInputControl({
      ...inputControl,
      name: '',
      startTime: currentTime,
      endTime: twoHourTime,
      number_of_people: 1,
      notes: '',
    })
  }

  var handleStart = (e) => {
    setInputControl({
      ...inputControl,
      startTime: e.target.value
    })
  }

  var handleEnd = (e) => {
    setInputControl({
      ...inputControl,
      endTime: e.target.value
    })
  }

  var handleName = (e) => {
    setInputControl({
      ...inputControl,
      name: e.target.value
    })
  }

  var handleNumber = (e) => {
    setInputControl({
      ...inputControl,
      number_of_people: e.target.value
    })
  }

  var handleNotes = (e) => {
    setInputControl({
      ...inputControl,
      notes: e.target.value
    })
  }

  var handleStatsStart = (e) => {
    console.log(e.target.value);
    setStatsControl({
      ...statsControl,
      startTime: e.target.value,
    })
  }

  var handleStatsEnd = (e) => {
    setStatsControl({
      ...statsControl,
      endTime: e.target.value,
    })
  }

  var cancelAdd = () => {
    setShowModal(false);
  }

  var closeStats = () => {
    setShowStatsModal(false);
  }

  var getStats = async () => {
    var stats = {};
    for (var key of Object.keys(RoomIDs)) {
      var roomStats = await getRoomStats(key);
      stats[key] = roomStats;        
    }
    setStatsState(stats);
    setShowStatsModal(true);

  }

  var getFormattedStats = () => {
    var statsArray = [];
    if (statsState) {
      for (var key of Object.keys(statsState)) {
        statsArray.push(<div className="m-5" key={key}><div>{key}</div> <div>Sessions: {statsState[key]["Sessions"]}</div> <div>People: {statsState[key]["People"]}</div></div>)
      }
    }
    return statsArray;
  }

  var handleChangeDate = (e) => {
    var newDate = {
      year: e.target.value.slice(0,4),
      month: e.target.value.slice(5,7),
      day: e.target.value.slice(8, 10),
      formatted: e.target.value,
    };
    setCurrentDate(newDate);
    window.localStorage.setItem("currentDate", JSON.stringify(newDate));
  }

  const cancelDML = () => {
    setShowDML(false);
  }
 
  return (
    <div>
      <div 
      id="dml-modal" 
      tabIndex="-1" 
      aria-hidden="true" 
      className=
      {classNames('absolute w-full z-50 justify-center items-center',
      {'hidden' : !showDML})}
    >
      <div className="relative p-4 w-full max-h-full">
          <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      DML Sessions
                  </h3>
                  <button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" onClick={cancelDML}>
                      <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                      </svg>
                      <span className="sr-only">Close modal</span>
                  </button>
              </div>
              <div className="p-4 bg-red-700 grid grid-cols-4">
                  {DMLSessions}
              </div>
              
              <div className="flex items-center p-4 md:p-5 border-t border-gray-200 rounded-b dark:border-gray-600">
                  
                  <button onClick={cancelDML} type="button" className="ms-3 text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600">Cancel</button>
              </div>
          </div>
      </div>
    </div>
      <BookModal showModal={showModal} currentRoom={currentRoom} cancelAdd={cancelAdd} inputControl={inputControl} handleStart={handleStart} handleEnd={handleEnd} handleName={handleName} handleNumber={handleNumber} handleNotes={handleNotes} sendEvent={sendEvent} ></BookModal>
      <StatsModal showStatsModal={showStatsModal} statsControl={statsControl} closeStats={closeStats} getFormattedStats={getFormattedStats}></StatsModal>
      <EditModal showEditModal={showEditModal} currentRoom={currentRoom} setShowEditModal={setShowEditModal} inputControl={inputControl} handleStart={handleStart} handleEnd={handleEnd} handleName={handleName} handleNumber={handleNumber} handleNotes={handleNotes} sendEdit={sendEdit}></EditModal>
      <DeleteModal showConfirmModal={showConfirmModal} setShowConfirmModal={setShowConfirmModal} handleDelete={handleDelete} inputControl={inputControl}></DeleteModal>
      <div className="grid grid-cols-6 pb-10">
        <div className="col-span-3 col-start-1 row-start-1 flex flex-row justify-start items-center">          
          <button hidden={!accessToken} onClick={() => setShowDML(true)} className="bg-orange-500 p-2 m-1 rounded">Digital Media Lab</button>
          <div className={classNames("p-2 m-1", {'hidden' : !accessToken && !expiresIn})}>
            <button onClick={getStats} className="bg-violet-500 p-2 m-1 rounded">Get Room Stats</button>
            <input value={statsControl.startTime} onChange={handleStatsStart} onFocus={closeStats} type="date" className="m-3 text-black" />
            <input value={statsControl.endTime} onChange={handleStatsEnd} onFocus={closeStats} type="date" className="m-3 text-black" />
          </div>
        </div>    
        <div className={classNames("flex flex-row col-span-4 row-start-1 col-start-2 justify-center items-center text-xl", {'hidden' : !accessToken})}>
          <label>Room reservations for </label>
          <input value={currentDate.formatted} onChange={handleChangeDate} type="date" className="m-3 text-black" />
        </div>      
        <div className="flex flex-row col-span-1 col-start-6 justify-end items-center">
          <div className="p-2 m-1">
            <button
              id="authorize_button"
              hidden={accessToken && expiresIn}
              onClick={handleAuthClick}
              className="bg-green-500 p-2 m-1 rounded"
            >
              Authorize
            </button>
            <button
              id="signout_button"
              hidden={!accessToken && !expiresIn}
              onClick={handleSignoutClick}
              className="bg-red-500 p-2 m-1 rounded"
            >
              Sign Out
            </button>
          </div>            
        </div>
      </div>
     
      <div className={classNames("grid grid-cols-5", {'hidden' : !accessToken && !expiresIn})}>
        <div className="flex flex-col text-center">
          <h4>Art Room</h4>
          {currentEvents["Art Room"]}
          <div className="flex flex-row justify-center">
          <button onClick={() => {setCurrentRoom("Art Room"); addEvent()}} className="bg-green-500 mt-5 p-2 w-1/2 rounded">Add Booking</button>
        </div>
      </div>
      <div className="flex flex-col text-center">
        <h4>Local History Room</h4>
        {currentEvents["Local History Room"]}
        <div className="flex flex-row justify-center">
          <button onClick={() => {setCurrentRoom("Local History Room"); addEvent()}} className="bg-green-500 mt-5 p-2 w-1/2 rounded">Add Booking</button>
        </div>
      </div>
      <div className="flex flex-col text-center">
        <h4>Study Room 1</h4>
        {currentEvents["Study Room 1"]}
        <div className="flex flex-row justify-center">
          <button onClick={() => {setCurrentRoom("Study Room 1"); addEvent()}} className="bg-green-500 mt-5 p-2 w-1/2 rounded">Add Booking</button>
        </div>
      </div>
      <div className="flex flex-col text-center">
        <h4>Study Room 2</h4>
        {currentEvents["Study Room 2"]}
        <div className="flex flex-row justify-center">
          <button onClick={() => {setCurrentRoom("Study Room 2"); addEvent()}} className="bg-green-500 mt-5 p-2 w-1/2 rounded">Add Booking</button>
        </div>
      </div>
      <div className="flex flex-col text-center">
        <h4>Study Room 3</h4>
        {currentEvents["Study Room 3"]}
        <div className="flex flex-row justify-center">
          <button onClick={() => {setCurrentRoom("Study Room 3"); addEvent()}} className="bg-green-500 mt-5 p-2 w-1/2 rounded">Add Booking</button>
        </div>
      </div>
    </div>
</div>

  );
};

 

export default Calendar;

 