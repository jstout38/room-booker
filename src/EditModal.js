import classNames from 'classnames';

export default function EditModal(props) {

  return (
    <div 
      id="edit-modal" 
      tabIndex="-1" 
      aria-hidden="true" 
      className=
      {classNames('overflow-y-auto overflow-x-hidden absolute top-1/4 left-1/3 w-1/2 z-50 justify-center items-center max-h-full',
      {'hidden' : !props.showEditModal})}
    >
      <div className="relative p-4 w-full max-w-2xl max-h-full">
          <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Edit Event for {props.currentRoom ? props.currentRoom : ""}
                  </h3>
                  <button type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" onClick={() => props.setShowEditModal(false)}>
                      <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                      </svg>
                      <span className="sr-only">Close modal</span>
                  </button>
              </div>
              <div className="p-4 bg-red-700 grid grid-cols-4">
                  <div>
                    <label>Start Time</label>
                  </div>
                  <div>
                    <input type='time' value={props.inputControl.startTime} onChange={props.handleStart} className='rounded p-1 text-black' id="startTime"/>                  
                  </div>
                  <div>
                    <label>End Time</label>
                  </div>
                  <div>
                    <input type='time' value={props.inputControl.endTime} onChange={props.handleEnd} className='rounded p-1 text-black' id="endTime"/>                  
                  </div>
                  <div className='mt-5'>
                    <label>Name</label>
                  </div>
                  <div className="mt-5 col-span-3">
                    <input type='text' value={props.inputControl.name} onChange={props.handleName} className='p-1 text-black rounded' id='name'/>
                  </div>
                  <div className='mt-5'>
                    <label>Number of people</label>
                  </div>
                  <div className="mt-5 col-span-3">
                    <input type='number' value={props.inputControl.number_of_people} onChange={props.handleNumber} className='rounded p-1 text-black w-20' id='number'/>
                  </div>
                  <div className='mt-5'>
                    <label>Notes</label>
                  </div>
                  <div className="mt-5 col-span-3">
                    <textarea value={props.inputControl.notes} onChange={props.handleNotes} className='p-1 text-black rounded w-80 align-text-top ' id='notes'/>
                  </div>
              </div>
              
              <div className="flex items-center p-4 md:p-5 border-t border-gray-200 rounded-b dark:border-gray-600">
                  <button 
                    onClick={props.sendEdit} 
                    disabled={props.inputControl.name.length === 0 || (((Number(props.inputControl.startTime.slice(0,2))) > Number(props.inputControl.endTime.slice(0,2))) || (Number(props.inputControl.startTime.slice(0,2)) >= Number(props.inputControl.endTime.slice(0,2)) && (Number(props.inputControl.startTime.slice(3,5)) > Number(props.inputControl.endTime.slice(3,5)))))} 
                    data-modal-hide="default-modal" 
                    type="button" 
                    className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-25">
                      Edit
                    </button>
                  <button onClick={() => props.setShowEditModal(false)} type="button" className="ms-3 text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600">Cancel</button>
              </div>
          </div>
      </div>
    </div>
  )
}