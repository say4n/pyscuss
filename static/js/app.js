// variables
var $window = $(window);
var $messages = $('.messages'); // Messages area
var $inputMessage = $('.inputMessage'); // Input message input box
var connected = false;
var typing = false;
var user = null;


var FADE_TIME = 150; // ms
var TYPING_TIMER_LENGTH = 400; // ms
var COLORS = [
    '#e21400', '#91580f', '#f8a700', '#f78b00',
    '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
    '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
];

// socket
var full = location.protocol+'//'+location.hostname+(location.port ? ':'+location.port: '');
// console.log(full);
var socket = io.connect(full + "/v1");

// new connection
socket.on('connect', function() {
    connected = true;
});

// new user joined
socket.on('user joined', function(message) {
    log(message + " has joined the conversation");
});

// new user joined
socket.on('status', function(users) {
    if (parseInt(users) > 1) {
        $(".counter").text(users + " users online");
    }
    else {
        $(".counter").text(users + " user online");
    }
});

// new messge
socket.on('new message', function(data) {
    var $usernameDiv = $('<span class="username"/>')
                            .text(data.username)
                            .css('color', getUsernameColor(data.username));
    var $messageBodyDiv = $('<span class="messageBody">')
                            .text(data.message);

    var $messageDiv = $('<li class="message"/>')
                            .data('username', data.username)
                            .append($usernameDiv, $messageBodyDiv);
    
    $messageDiv.hide().fadeIn(FADE_TIME);
    $messages.append($messageDiv);
    $('html, body').animate({scrollTop: $(document).height()-$(window).height()});
});

$(function() {
    // entry
    $("#form").fadeIn("fast");
    $("#usernick").focus();

    // handle new user
    $("#launch").on("click", function() {
        handleNewUser();
    });
});

// Log events 
function log(message) {
    var $logMessage = $('<li class="log"/>')
                        .text(message);

    $logMessage.hide().fadeIn(FADE_TIME);
    $messages.append($logMessage);
    $('html, body').animate({scrollTop: $(document).height()-$(window).height()});

}

// Handle new user
function handleNewUser() {
    // get user name 
    if ($("#usernick").val().trim().length) {
        user = $("#usernick").val();
    }
    else {
        user = "Anonymous" + Math.floor((Math.random() * 1000) + 1).toString();
    }

    // hide form and show chat
    $("#form").fadeOut("fast", function() {
        $("#form").hide();
        $("#chat").fadeIn("fast");

        // console.log("User: ", user);
        socket.emit("new user", user);
    });

    // reset name
    $("#usernick").val("");
}

// Gets the color of a username through our hash function
function getUsernameColor(username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
        hash = username.charCodeAt(i) + (hash << 6) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
}

// Updates the typing event
function updateTyping() {
    if (connected) {
        if (!typing) {
            typing = true;
            socket.emit('typing');
        }
        lastTypingTime = (new Date()).getTime();

        setTimeout(function() {
            var typingTimer = (new Date()).getTime();
            var timeDiff = typingTimer - lastTypingTime;
            if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
                socket.emit('stop typing');
                typing = false;
            }
        }, TYPING_TIMER_LENGTH);
    }
}

// Send message to server
function sendMessage() {
    var message = $inputMessage.val();

    if (message && connected) {
        $inputMessage.val('');
        payload = {
            username: user,
            message: message
        }

        socket.emit("message", payload);
    }
}


// Keyboard events

$window.keydown(function(event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
        $inputMessage.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
        if (user && user.length) {
            sendMessage();
            socket.emit('stop typing');
            typing = false;
        }
        else {
            handleNewUser();
        }
    }
});

$inputMessage.on('input', function() {
    updateTyping();
});