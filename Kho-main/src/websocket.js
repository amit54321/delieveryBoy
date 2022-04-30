module.exports = function(io)
{
	require('./websocket/server')(io);		//Server - Data received
	require('./websocket/client')(io);		//Client - Data received
}
