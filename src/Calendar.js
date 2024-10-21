import React, { useEffect, useState } from "react";
import classNames from 'classnames';
import DeleteModal from './DeleteModal';
import EditModal from './EditModal';
import StatsModal from './StatsModal';
import BookModal from './BookModal';
import DMLModal from './DMLModal';
import DMLEditModal from './DMLEditModal';
import DMLCancelModal from'./DMLCancel';

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
    "Local History Room": 'c_8fee94ec7ce502f8ecb04860e97898b384555700d380d8eb95a4579d47569105@group.calendar.google.com',
    "Art Room": 'c_1c69963d5ae33c5dc15b0c163f5e51a9d2b1e9f82b88b3ac5aaf3535f19b2f3a@group.calendar.google.com',
    "Study Room 1": 'c_44bc2234ce4fca9245f006cac046aba8aa43cd3af9b15a656ed43e1377737caa@group.calendar.google.com',
    "Study Room 2": 'c_9cb8e721e6a6b4eb236cbc29d528014193fdd9e8b91953eeea51437c36a93d1a@group.calendar.google.com',
    "Study Room 3": 'c_0bf448ebdffe9d6289231b96539bcf31768b8cd2ffd55089d9231423c1d46cd8@group.calendar.google.com',
    "Sensory Room": 'c_5ece2679a2d84b0daf73c627e6423d5ffdc1fe2ece359dbad0e6b28224bd0642@group.calendar.google.com',
  }

  const DMLID = "c_m9r7qdg8uvf7423qe3ph24cdd4@group.calendar.google.com";

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

  const [ DMLControl, setDMLControl ] = useState({   
    name: "",
    contact: "",
    number_of_people: 0,
    notes: "",
    booked: false,
  })

  const today = new Date().toLocaleDateString();
  var [ today_month, today_day, today_year ] =today.split("/");

  if (today_day.length === 1) {
    today_day = "0" + today_day;
  }

  if (today_month.length === 1) {
    today_month = "0" + today_month;
  }

  var prevDate = window.localStorage.getItem("currentDate");
  
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
  const [ showDMLEditModal, setShowDMLEditModal ] = useState(false);
  const [ editId, setEditId ] = useState("");  
  const [ currentRoom, setCurrentRoom ] = useState('Art Room');
  const [ statsState, setStatsState ] = useState();
  const [ showConfirmModal, setShowConfirmModal ] = useState(false);
  const [ currentEvent , setCurrentEvent ] = useState();
  const [ showDML, setShowDML ] = useState(false);
  const [ showDMLCancelModal, setShowDMLCancelModal ] = useState(false);

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
    var startTime = `${currentDate.year}-${currentDate.month}-${currentDate.day}T${inputControl.startTime}:00.000`;
    var endTime = `${currentDate.year}-${currentDate.month}-${currentDate.day}T${inputControl.endTime}:00.000`;
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

  async function handleDML(eventId) {
    let response;
    try {
      const request = {
        calendarId: DMLID,
        eventId: eventId,
      };
      response = await gapi.client.calendar.events.get(request);
    } catch (err) {
      //document.getElementById("content").innerText = err.message;
      handleAuthClick();
      return;
    }
    setDMLControl({      
      name: response.result.summary ? response.result.summary : "",
      number_of_people: response.result.extendedProperties ? response.result.extendedProperties.private.number_of_people : 1,
      contact: response.result.extendedProperties ? response.result.extendedProperties.private.contact : "",      
      notes: response.result.description ? response.result.description : "",
      booked: response.result.extendedProperties ? response.result.extendedProperties.private.booked : false,
    })
    setEditId(response.result);
    setShowDMLEditModal(true);
  }

  async function sendDML() {
    var event = {
        ...editId,
        summary: DMLControl.name,
        description: DMLControl.notes,        
        extendedProperties: {
          private: {
            number_of_people: DMLControl.number_of_people,
            contact: DMLControl.contact,
            booked: "true",
          }
        }
    };
    var request = gapi.client.calendar.events.patch({
      resource: event,
      calendarId: DMLID,
      eventId: editId.id,
    });
    request.execute(
      async (event) => {
        updateDML();
      },
        (error) => {
          handleAuthClick();
          return;
      }
    )
    setShowDMLEditModal(false);
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

function handleDMLCancel() {  
  var event = {
        ...editId,
        summary: '',
        description: '',        
        extendedProperties: {
          private: {
            number_of_people: 1,
            booked: "false",
            contact: ''
          }
        }
    };
    var request = gapi.client.calendar.events.patch({
      resource: event,
      calendarId: DMLID,
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
    );
    setShowDMLCancelModal(false);
}

function confirmDMLCancel(id) {
  setCurrentEvent(id);
  setShowDMLCancelModal(true);
  setShowDMLEditModal(false);
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
    updateDML();
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
      <div className="bg-blue-600 mt-5 ml-2 mr-2 p-2 rounded grid grid-rows-1 grid-cols-12 text-white" key={event.id}>
        <div className="col-span-12 row-start-1 col-start-1">
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
        <span className="col-span-1 row-start-1 col-start-11 flex flex-row">
        <div>
        <svg onClick={() => handleEdit(id, event.id)} className="p-1 w-6 h-6 text-white dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 20 18">
          <path d="M12.687 14.408a3.01 3.01 0 0 1-1.533.821l-3.566.713a3 3 0 0 1-3.53-3.53l.713-3.566a3.01 3.01 0 0 1 .821-1.533L10.905 2H2.167A2.169 2.169 0 0 0 0 4.167v11.666A2.169 2.169 0 0 0 2.167 18h11.666A2.169 2.169 0 0 0 16 15.833V11.1l-3.313 3.308Zm5.53-9.065.546-.546a2.518 2.518 0 0 0 0-3.56 2.576 2.576 0 0 0-3.559 0l-.547.547 3.56 3.56Z"/>
          <path d="M13.243 3.2 7.359 9.081a.5.5 0 0 0-.136.256L6.51 12.9a.5.5 0 0 0 .59.59l3.566-.713a.5.5 0 0 0 .255-.136L16.8 6.757 13.243 3.2Z"/>
        </svg>
        </div>
        <div>
        <svg onClick={() => confirmDelete(id, event.id)} className="p-1 w-6 h-6 text-white dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z"/>
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
    
    if (today_day.length === 1) {
      today_day = "0" + today_day;
    }

    if (today_month.length === 1) {
      today_month = "0" + today_month;
    }

    let start = `${dml_year}-${dml_month}-${dml_day}T00:00:00.000-05:00`;
  
    let response;
    try {
      const request = {
        calendarId: DMLID,
        timeMin: start,
        maxResults: 8,
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
      var booked = false;
      if (event.extendedProperties && event.extendedProperties.private.booked === "true") {
        booked = true;
      }
      return (
      <div className={classNames("mt-5 ml-2 mr-2 p-2 rounded grid grid-rows-1 grid-cols-8", {"bg-blue-600" : !booked}, {"bg-blue-300" : booked})} onClick={() => handleDML(event.id)} key={event.id}>
        <div className="col-span-8 row-start-1 col-start-1">
          
          <div>
            {parseDateTime(event.start.dateTime)} - {parseDateTime(event.end.dateTime)}
          </div>
          <div>
            {`${event.start.dateTime.slice(5,7)}-${event.start.dateTime.slice(8,10)}-${event.start.dateTime.slice(0,4)}`}
          </div>
          <div>
            {booked ? `Booked for ${event.summary} - (${event.extendedProperties.private.contact})` : "Available"}
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
      handleAuthClick();
      return;
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
          handleAuthClick();
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

    if (currentTime.slice(9,11) === 'PM'  && currentTime.slice(0,2) !== "12") {
    
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

  var handleDMLName = (e) => {
    setDMLControl({
      ...DMLControl,
      name: e.target.value,
    })
  }

  var handleDMLNumber = (e) => {
    setDMLControl({
      ...DMLControl,
      number_of_people: e.target.value,
    })
  }

  var handleDMLNotes = (e) => {
    setDMLControl({
      ...DMLControl,
      notes: e.target.value,
    })
  }

  var handleDMLContact = (e) => {
    setDMLControl({
      ...DMLControl,
      contact: e.target.value,
    })
  }

  var handleStatsStart = (e) => {
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
    window.localStorage.setItem("currentDate", JSON.stringify(newDate))
  }

  var setToday = () => {
    var newDate = {
      day: today_day,
      month: today_month,
      year: today_year,
      formatted: `${today_year}-${today_month}-${today_day}`,
    };
    setCurrentDate(newDate);
    window.localStorage.setItem("currentDate", JSON.stringify(newDate))
  }

  const cancelDML = () => {
    setShowDML(false);
  }
 
  return (
    <div>
      <DMLModal showDML={showDML} cancelDML={cancelDML} DMLSessions={DMLSessions}></DMLModal>
      <DMLEditModal showDMLEditModal={showDMLEditModal} setShowDMLEditModal={setShowDMLEditModal} editId={editId} parseDateTime={parseDateTime} DMLControl={DMLControl} handleDMLName={handleDMLName} handleDMLContact={handleDMLContact} handleDMLNotes={handleDMLNotes} handleDMLNumber={handleDMLNumber} sendDML={sendDML} confirmDMLCancel={confirmDMLCancel}></DMLEditModal>
      <BookModal showModal={showModal} currentRoom={currentRoom} cancelAdd={cancelAdd} inputControl={inputControl} handleStart={handleStart} handleEnd={handleEnd} handleName={handleName} handleNumber={handleNumber} handleNotes={handleNotes} sendEvent={sendEvent} ></BookModal>
      <StatsModal showStatsModal={showStatsModal} statsControl={statsControl} closeStats={closeStats} getFormattedStats={getFormattedStats}></StatsModal>
      <EditModal showEditModal={showEditModal} currentRoom={currentRoom} setShowEditModal={setShowEditModal} inputControl={inputControl} handleStart={handleStart} handleEnd={handleEnd} handleName={handleName} handleNumber={handleNumber} handleNotes={handleNotes} sendEdit={sendEdit}></EditModal>
      <DeleteModal showConfirmModal={showConfirmModal} setShowConfirmModal={setShowConfirmModal} handleDelete={handleDelete} inputControl={inputControl}></DeleteModal>
      <DMLCancelModal showDMLCancelModal={showDMLCancelModal} setShowDMLCancelModal={setShowDMLCancelModal} confirmDMLCancel={confirmDMLCancel} handleDMLCancel={handleDMLCancel}></DMLCancelModal>
      <div className="grid grid-cols-6 pb-10 bg-teal-200">
        <div className="col-span-3 col-start-1 row-start-1 flex flex-row justify-start items-center">          
          <button hidden={!accessToken} onClick={() => setShowDML(true)} className="bg-orange-500 p-2 m-1 rounded">Digital Media Lab</button>
          <div className={classNames("p-2 m-1", {'hidden' : !accessToken && !expiresIn}, {'z-50': !showDML})}>
            <button onClick={getStats} className="bg-violet-500 p-2 m-1 rounded">Get Room Stats</button>
            <input value={statsControl.startTime} onChange={handleStatsStart} onFocus={closeStats} type="date" className="m-3 text-black" />
            <input value={statsControl.endTime} onChange={handleStatsEnd} onFocus={closeStats} type="date" className="m-3 text-black" />
          </div>
        </div>    
        <div className={classNames("flex flex-row col-span-4 row-start-1 col-start-2 justify-center items-center text-black text-xl", {'hidden' : !accessToken})}>
          <label>Room reservations for </label>
          <input value={currentDate.formatted} onChange={handleChangeDate} type="date" className="m-3 text-black" />
          <button onClick={setToday} className="bg-blue-800 p-1 text-white rounded">Today</button>
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
     
      <div className={classNames("grid grid-cols-6 bg-orange-200 text-black h-screen", {'hidden' : !accessToken && !expiresIn})}>
        <div className="flex flex-col text-center p-2">
          <h4 className="text-xl">Art Room</h4>
          <div className="flex flex-row justify-center">
            <button onClick={() => {setCurrentRoom("Art Room"); addEvent()}} className="bg-green-600 mt-5 p-2 w-1/2 rounded text-white">Add Booking</button>
          </div>
          {currentEvents["Art Room"]}
          
        </div>
        <div className="flex flex-col text-center p-2">
          <h4 className="text-xl">Local History Room</h4>
          <div className="flex flex-row justify-center">
            <button onClick={() => {setCurrentRoom("Local History Room"); addEvent()}} className="bg-green-600 mt-5 p-2 w-1/2 rounded text-white">Add Booking</button>
          </div>
          {currentEvents["Local History Room"]}
        </div>
        <div className="flex flex-col text-center p-2">
          <h4 className="text-xl">Study Room 1</h4>
          <div className="flex flex-row justify-center">
            <button onClick={() => {setCurrentRoom("Study Room 1"); addEvent()}} className="bg-green-600 mt-5 p-2 w-1/2 rounded text-white">Add Booking</button>
          </div>
          {currentEvents["Study Room 1"]}          
        </div>
        <div className="flex flex-col text-center p-2">
          <h4 className="text-xl">Study Room 2</h4>
          <div className="flex flex-row justify-center">
            <button onClick={() => {setCurrentRoom("Study Room 2"); addEvent()}} className="bg-green-600 mt-5 p-2 w-1/2 rounded text-white">Add Booking</button>
          </div>
          {currentEvents["Study Room 2"]}          
        </div>
        <div className="flex flex-col text-center p-2">
          <h4 className="text-xl">Study Room 3</h4>
          <div className="flex flex-row justify-center">
            <button onClick={() => {setCurrentRoom("Study Room 3"); addEvent()}} className="bg-green-600 mt-5 p-2 w-1/2 rounded text-white">Add Booking</button>
          </div>
          {currentEvents["Study Room 3"]}          
        </div>
        <div className="flex flex-col text-center bg-purple-300 p-2">
          <h4 className="text-xl">Sensory Room</h4>
          <div className="flex flex-row justify-center">
            <button onClick={() => {setCurrentRoom("Sensory Room"); addEvent()}} className="bg-green-600 mt-5 p-2 w-1/2 rounded text-white">Add Booking</button>
          </div>
          {currentEvents["Sensory Room"]}          
      </div>
    </div>
</div>

  );
};

 

export default Calendar;

 