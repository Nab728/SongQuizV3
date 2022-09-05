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
var redirect_uri = "https://nab728.github.io/SongQuizV3/"; //switch to the html page you are 
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
        let pTitle = document.querySelector("#songTitle").value;
        let pArtist = document.querySelector("#songArtist").value;
        //add score to the corresponding player
        checkAnswer(pTitle, pArtist);
        //go to next song
        nextSong();
        //prevent default submit button action
        e.preventDefault();
    });
   
}); 
function checkAnswer(pTitle, pArtist)
{
    if (pTitle.toLowerCase().trim() == title.toLowerCase())
    {
        //if else statement
        playerOneTurn ? p1Score++ : p2Score++;
    }
    if(pArtist.toLowerCase().trim() == artist.toLowerCase())
    {
        playerOneTurn ? p1Score++ : p2Score++;
    } 
    //make the input field empty 
    document.getElementById("songTitle").value = ""; 
    document.getElementById("songArtist").value = "";
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
    xhr.open("GET", 'https://api.spotify.com/v1/search?q=' + str + '&type=track', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + localStorage.getItem("access_token")); 
    xhr.onload = callback;
    xhr.send();
}
//find artist based on if the artist is listed in the youtube video title (requirements: artist is on youtube title)
function findRightArtist(list, title)
{
    for (let i = 0; i < list.length; i++)
    {
        //songs have mutlipe aritsts sometimes but we want the first result
        let orgName = list[i]["artists"][0]["name"];
        let name = orgName.toLowerCase().trim();
        if (title.toLowerCase().trim().includes(name))
        { 
           return orgName;
        }
    }
}
function processRequest() 
{  
    if (xhr.readyState == 4 && xhr.status == 200) 
    {
        
        //variable that checks if the xmlhttprequest was successful
        isClientWorking = true;
        var response = JSON.parse(xhr.responseText);
        var result = response["tracks"]["items"];
        //select the first result (I've tested the most popular result and sometimes it failed also the first result failed)
        //ex: Blinding Lights (doesn't work with the most popular result) and Bad Blood (doesn't work with first result) from the youtube playlist
        let rightArtist = findRightArtist(result, songs[songIndex].snippet.title);
        //for the most part the title is always correct but the artist isn't 
        //so by using findRightArtist it results in sometimes mismatched picking of what item to choose for each answer.
        title  = formatString(result[0]["name"]);
        artist = formatString(rightArtist); 
    }
    else if (xhr.status == 401)
    {
        console.log("id is " + client_id);
        console.log("secret is " + client_secret);
        console.log("refresh token is " + refresh_token);
        console.log("access token is " + access_token);
        if (client_id != "" && client_secret != "" && refresh_token != "" && refresh_token != null)
        {
            refreshAccessToken();
        }
        else
        {
            alert("access token has expired. Returning to home page.");
            //redirect user to homescreen
            document.getElementById("gamePage").style.display = 'none';
            document.getElementById("startPage").style.display = 'flex';
            isClientWorking = false;
        }
    }
}
//regex to replace all none letter based characters to "" 
function formatString(s)
{
    if(s != undefined)
    {
        //removes the part after the dash
        s = s.split("-")[0];
        //turns accent mark letters to regular latin characters
        //normalize turns accent marks to latin characters in unicode and replace removes the diacritic marks
        s = s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
        //removes any non letter character (other than '(There's) and !(P!nk)and + (Ariande Grande 34+35)) and anything in between parentheses
        s = s.replace(/(\([^)]*\))|([^a-zA-Z0-9'!+$ ])/g, "").trim();
        //removes multiple spaces or tabs
        s = s.replace(/\s\s+/g, ' ');
    }
    return s;
}
//main function to play the next song
function nextSong()
{
    //start next song
    startSongPlayer();

    //show player turn
    playerOneTurn = !playerOneTurn;
    let turn = checkTurn();
    //display score
    document.querySelector(".turn").innerHTML = "Player " + turn + " Turn"; 
    document.querySelector("#p1score").innerHTML = "Player 1 : " + p1Score;
    document.querySelector("#p2score").innerHTML = "Player 2 : " + p2Score;

    //format the correct answer
    document.querySelector("#titleAns").innerHTML = "Title: " + title.trim();
    document.querySelector("#artistAns").innerHTML = "Artist: " + artist.trim();

   
    
    //hide all buttons essentially
    document.getElementById("submit").style.display = "none";
    document.getElementById("replay").style.display = "none";
    document.getElementById("next").style.display = "none";
    document.getElementById('play').style.display = 'none';
    //make submit button reaapear
    setTimeout(function()
    {
        document.getElementById("submit").style.display = "block";
        document.getElementById("replay").style.display = "block";
        document.getElementById("next").style.display = "block";
        document.getElementById('play').style.display = 'block';
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
    let title = songs[songIndex].snippet.title;
    checkTitle(title);
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
    }
    prevSongs.push(index);
    if (prevSongs.length >= 10)
    {
        prevSongs.shift();
    }
    console.log(prevSongs);
    console.log("Index chosen is " + index);
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
            videoId: "00NgUctWoLQ",
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
function replayVideo()
{ 
    var videoPlayer = document.querySelector('#video');
    console.log("Hi");
    videoPlayer.src = videoPlayer.src;
}
