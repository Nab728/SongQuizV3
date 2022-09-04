//other variables needed
//songs is the variable to hode the json data
let songs;
let songIndex = 0;
//prevSongs holds 10 previous songs that were played and we don't want to repeat
var prevSongs = [];
//player scores
let p1Score = 0;
let p2Score = 0;

//vairable for the xmlhttprequest
let xhr;
//varaibles to hold the answers to the quiz
var title;
var artist;
//determine the player turn
let playerOneTurn = true;
//what second to start the song
let start;
//did the xmlhttprequest work
let isClientWorking = true;

//load youtube api
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

//youtbe player variables
var player;
var isWorking = false;

//url change to your domain of the website
var redirect_uri = "http://127.0.0.1:5501/SongQuizV2/templates/index.html"; //switch to the html page you are 
//client criendentals from spotify api
var client_id;
var client_secret;

//spotify-web-api stuff
const AUTHORIZE = "https://accounts.spotify.com/authorize";
const TOKEN = "https://accounts.spotify.com/api/token";
var access_token = null;
var refresh_token = null;

document.addEventListener('DOMContentLoaded', function()
{
    //when submit button is pressed
    document.querySelector("#form").addEventListener('submit', function(e) 
    {
        //get user's answers
        let titleAns = document.querySelector("#songTitle").value;
        let artistAns = document.querySelector("#songArtist").value;
        //format th correct answer
        title = formatString(title);
        artist = formatString(artist);
        //add score to the corresponding player
        addScore(titleAns, title, artistAns, artist);
        //go to next song
        nextSong();
        //prevent default submit button action
        e.preventDefault();
    });
   
}); 
function addScore(title, titleAns, artistAns, artist)
{
    if (title.toLowerCase().trim() == titleAns.toLowerCase().trim())
    {
        //if else statement
        playerOneTurn ? p1Score++ : p2Score++;
    }
    if(artistAns.toLowerCase().trim() == artist.toLowerCase().trim())
    {
        playerOneTurn ? p1Score++ : p2Score++;
    } 
    //make the input field empty 
    document.getElementById("songTitle").value = ""; 
    document.getElementById("songArtist").value = "";
}
function formatString(s)
{
    if(s != undefined)
    {
        const str = "abc's test#s";
        //regex to replace all none letter based characters to "" 
        str.replace(/[^a-zA-Z ]/g, "");
    }
    return s;
}
//first step is to get the client_id and client_secret from the user
function requestAuthorization()
{
    let url = AUTHORIZE;
    client_id = document.getElementById("clientId").value;
    client_secret = document.getElementById("clientSecret").value;
    localStorage.setItem("client_id", client_id);
    //client_secret should be hidden
    localStorage.setItem("client_secret", client_secret); 
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    // Show Spotify's authorization screen
    window.location.href = url; 
}
//load the json file and start the game if everything exists
function onPageLoad()
{
    client_id = localStorage.getItem("client_id");
    client_secret = localStorage.getItem("client_secret");
    if ( window.location.search.length > 0 )
    {
        handleRedirect();
    }
    else
    {
        access_token = localStorage.getItem("access_token");
        if ( access_token == null )
        {
            // we don't have an access token so present token section
            document.getElementById("startPage").style.display = 'flex';  
        }
        else 
        {
            // we have an access token so present device section
            document.getElementById("gamePage").style.display = 'block';
            fetch("./topHits.json")           
            .then((result) => 
            {
                return result.json()
            }).then((data) =>
            {
                songs = data.items 
                startSongPlayer() 
            });
        }
       
    }
}
//get the code return from enterign in the clien_id and clien_secret
function handleRedirect()
{
    let code = getCode();
    fetchAccessToken(code); 
    // remove code param from url
    window.history.pushState("", "", redirect_uri);
}
function getCode()
{
    let code = null;
    const queryString = window.location.search;
    if ( queryString.length > 0 )
    {
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code')
    }
    return code;
}
//get access_token
function fetchAccessToken(code)
{
    let body = "grant_type=authorization_code";
    body += "&code=" + code; 
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + client_id;
    body += "&client_secret=" + client_secret;
    callAuthorizationApi(body);
}
function callAuthorizationApi(body)
{
    let xhr = new XMLHttpRequest();
    xhr.open("POST", TOKEN, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ":" + client_secret));
    xhr.send(body);
    xhr.onload = handleAuthorizationResponse;
}
//store the access token and the refresh token to a local storage
function handleAuthorizationResponse()
{
    if (this.status == 200)
    {
        var data = JSON.parse(this.responseText);
        if ( data.access_token != undefined ){
            access_token = data.access_token;
            localStorage.setItem("access_token", access_token);
        }
        if ( data.refresh_token  != undefined ){
            refresh_token = data.refresh_token;
            localStorage.setItem("refresh_token", refresh_token);
        }
        onPageLoad();
    }
    else 
    {
        console.log(this.responseText);
        alert(this.responseText);
    }
}
//if access_token expires we refresh the access token with the refresh token
function refreshAccessToken()
{
    refresh_token = localStorage.getItem("refresh_token");
    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + client_id;
    callAuthorizationApi(body);
}
function checkTitle(answer)
{
    callApi(answer, processRequest);
}
//calls spotify api to request the answer for the artist and song based on youtube title
//ok so XMLHTTPRequest only works if you have an onload otherwise you can only call it once
function callApi(str, callback)
{
    //turns it to what the actual search query is
    str = encodeURIComponent(str);
    xhr = new XMLHttpRequest();
    xhr.open("GET", 'https://api.spotify.com/v1/search?q=' + str + '&type=track&limit=5', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem("access_token")); 
    xhr.onload = callback;
    xhr.send();
}
function processRequest() 
{  
    if (xhr.readyState == 4 && xhr.status == 200) 
    {
        //variable that checks if the xmlhttprequest was successful
        isClientWorking = true;
        var response = JSON.parse(xhr.responseText);
        var result = response["tracks"]["items"];
        let arr = [];
        //set answer of artist to be the most popular song
        for (let i = 0; i < response["tracks"]["items"].length; i++)
        {
            arr.push(response["tracks"]["items"][i]["popularity"]);
        }
        //find max popularity of the 5 tracks returned
        let ans = (max) => max == Math.max.apply(Math, arr);
        let index = arr.findIndex(ans);

        title  = result[index]["name"];
        artist = result[index]["artists"][0]["name"];
    }
    else if (xhr.status == 401)
    {
        alert("access token has expired. Returning to home page.");
        
        if (client_id != "" && client_secret != "" && refresh_token != "" && refresh_token != undefined)
        {
            refreshAccessToken();
        }
        else
        {
            document.getElementById("gamePage").style.display = 'none';
            document.getElementById("startPage").style.display = 'flex';
            isClientWorking = false;
        }
    }
}
//main function to play the next song
function nextSong()
{
    //start next song
    startSongPlayer();

    //show player turn
    playerOneTurn = !playerOneTurn;
    let turn = checkTurn();
    document.querySelector(".turn").innerHTML = "Player " + turn + " Turn"; 
    document.querySelector(".score").innerHTML = "Player 1: " + p1Score + "&nbsp&nbsp" + "Player 2: " + p2Score;
    
    // show the answer
    document.querySelector("#answer").innerHTML = "Answer: " + title.trim();
    document.querySelector("#answer2").innerHTML = "Artist: " + artist.trim();

    //show play button again
    document.getElementById('play').style.display = 'block';
    
    //hide the submit button
    document.getElementById("submit").style.display = "none";

    //make submit button reaapear
    setTimeout(function()
    {
        document.getElementById("submit").style.display = "block";
        
    }, 2000);

    //set the input field to null values
    document.getElementById("songTitle").value = ""; 
    document.getElementById("songArtist").value = "";

    //remove the answer key after 2 seconds
    setTimeout(function()
    {
        document.getElementById("titleAns").innerHTML = "";
        document.getElementById("artistAns").innerHTML = "";
    }, 2000);
    // console.log(songs[songIndex].snippet.title);
}
function checkTurn()
{
    if(playerOneTurn)
    {
        return 1;
    }
    return 2;
}
function startSongPlayer()
{ 
    songIndex = chooseSong();
    checkTitle(songs[songIndex].snippet.title);
    //start is undefined in the beginning for some reason but it still works so ig that's ok
    //0 to length of the song - 20 seconds (so we don't play the end of the song)
    start = Math.floor(Math.random() * (150 - 20 + 1)) + 20;
    if(isClientWorking)
    {
        createPlayer(songs[songIndex].snippet.resourceId.videoId, start);
    }
}
//chooses Song based on the previous songs played and randomly
function chooseSong()
{
    let index = Math.floor(Math.random() * songs.length); 
    while (prevSongs.includes(index))
    {
        index = Math.floor(Math.random() * songs.length);
        //console.log("While loop song chosen is " + index);
    }
    prevSongs.push(index);
    if (prevSongs.length >= 10)
    {
        // removes first element from the array
        prevSongs.shift();
    }
    return index;
}
// have to name it this way and idk if it actually matters too much 
function onYouTubeIframeAPIReady() 
{
    isWorking = true;
}
// make sure to change id when testing
function createPlayer(id, start)
{
    if (isWorking)
    {
        if (player != undefined)
        {
            player.destroy();
        }
        player = new YT.Player("video", 
        {
            height: 0,
            width: 0,
            videoId: id,
            playerVars: 
            {
                //no full scrren
                'fs' : 0,
                'controls': 0,
                'playsinline': 1,
                'autoplay' : 1,
                //disable keyboard
                'disablekb': 1,
                'rel': 0,
                //makes it so user's can be affected by iframe player api calls but it seems it the api calls still work without this line
                'enablejsapi': 1,
                //set start and end
                'start': start,
                'end': start + 10
            },
            events: 
            {
             //call these functions when ready and when the state changes
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
            }
        });
        
    }
}
//the function the button calls  
function playVideo()
{
    //using seekTo is the same essentially but makes replay harder to use
    player.playVideo();
}
//sometimes when it autoplays without user input it should call the playVideo function
function onPlayerReady(event) 
{   
    playVideo();
}

//if playing make the play button disappear and set timer for 10 seconds
function onPlayerStateChange(event) {
    if(event.data == YT.PlayerState.PLAYING)
    {
       document.getElementById('play').style.display = 'none';
       console.log("I'm Playing");
       setTimeout(stopVideo, 10000);
    }
}
function stopVideo() 
{
    console.log("I have ended");
    player.stopVideo();
}
function replay()
{ 
    var videoPlayer = document.querySelector('#video');
    videoPlayer.src = videoPlayer.src;
}
