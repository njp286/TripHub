var mongoose = require('mongoose'),
	URLSlugs = require('mongoose-url-slugs');

// my schema goes here!




var Item = new mongoose.Schema({
        name: String,
        completed: Boolean
});

Item.plugin(URLSlugs('name'));

var ToDoList = new mongoose.Schema({
        name: String,
        items: [Item]
});

ToDoList.plugin(URLSlugs('name'));

var Flight = new mongoose.Schema({
        airline: String,
        date: String,
        flightNum: String,
        terminal: String,
});

Flight.plugin(URLSlugs('flightNum'));

var Hotel = new mongoose.Schema({
        name: String,
        address: String,
        chInDate: String,
        chOutDate: String,
});

Hotel.plugin(URLSlugs('name'));



var Trip = new mongoose.Schema({
        name: String,
        destination: String,
        flights: [Flight],
        hotels: [Hotel],
        toDo: [ToDoList]
});

Trip.plugin(URLSlugs('name'));



var User = new mongoose.Schema({
        fname: String,
        lname: String,
        email: String,
        pass: String,
        trips: [Trip]
});

User.plugin(URLSlugs('email'));



mongoose.model('Item', Item);
mongoose.model('ToDoList', ToDoList);
mongoose.model('Hotel', Hotel);
mongoose.model('Flight', Flight);
mongoose.model('User', User);
mongoose.model('Trip', Trip);

	


mongoose.connect('mongodb://localhost/triphub');
