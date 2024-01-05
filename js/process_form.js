//handles form submission and sends ajax request to server when form is submitted

document.getElementById('process_subscription').addEventListener('submit', function (event) { //listen for form submission
    event.preventDefault(); //prevent default form submission
    
    const formData = new FormData(event.target); //get form data
    const $email = formData.get('email'); //get email from form data

    //Store HTML Page Elements
    const messageDiv = document.getElementById('message'); // Location to display Message to user

  // data to be sent to the POST request
  let _data = {
      email: $email
    }
  
  fetch('http://127.0.0.1:3001/subscribe', {  //make POST request to server
    method: "POST",
    body: JSON.stringify(_data),
    headers: {"Content-type": "application/json; charset=UTF-8"} //tell server to expect JSON data
  })
  
  .then((response) => response.json()) //parse response as JSON

  //then handle the response
  .then((data) => {
    console.log('Success Server sent the following JSON Response:', data);

    //display message to user
    messageDiv.textContent = data.message;
    messageDiv.style.backgroundColor = 'green';
  })

  .catch((error) => {
    console.error('Error:', error); //handle any errors that occur during the request
});

  
}); //end of form submission listener

