var restify = require('restify');
var builder = require('botbuilder');

var server = restify.createServer();
console.log('*** PORT : ', process.env.PORT);
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session) {
    session.send("You said: %s", session.message.text);
});

// Send welcome message when this bot connects to conversation
bot.on('conversationUpdate', function (message) {
    message.membersAdded.forEach(function (identity) {
        if (identity.id === message.address.bot.id) {
            message.address.user = identity;
            console.log('Bot joined the chat');
        } else {
            bot.send(new builder.Message().address(message.address)
                .text('~* Bot joined the chat. *~'));
                setTimeout(function() { 
                    bot.send(new builder.Message().address(message.address)
                        .text('Hello, user!'));
                }, 2500);
        }
    });
});

// --------------------------------
// Recognizers / keyword triggers
// --------------------------------

var customRecognizer = {
    recognize: function (context, done) {
        var intent = { score: 0.0 };
        if (context.message.text) {
            var txt = context.message.text.toLowerCase();
            var hello = txt.match(/^hey$|^hello|^hi$|^hi bot$/i);
            var help = txt.match(/^help/i);
            var bye = txt.match(/^bye|^goodbye|^stop$|^quit$/i);
            var game = txt.match(/^game|play a game/i);

            if (hello) intent = { score: 1.0, intent: 'Hello' };
            if (help) intent = { score: 1.0, intent: 'Help' };
            else if (bye) intent = { score: 1.0, intent: 'Goodbye' };
            else if (game) intent = { score: 1.0, intent: 'Game' };
        }
        done(null, intent);
    }
};
bot.recognizer(customRecognizer);

bot.dialog('helpDialog', function (session) {
    session.endDialog("I see you're asking for help. I'm a simple bot. " +
                        "For the most part, I just repeat back anything you say.");
}).triggerAction({ matches: 'Help' });

bot.dialog('helloDialog', function (session) {
    session.endDialog("Hi user!");
}).triggerAction({ matches: 'Hello' });

bot.dialog('gameDialog', function (session) {
    session.endDialog("I'm coming up with a game, but it's not finished yet. Ask me again another time!");
}).triggerAction({ matches: 'Game' });

bot.endConversationAction('goodbyeAction', "Ok, See you later.", { matches: 'Goodbye' });
  
