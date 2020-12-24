
/*********************************************************************************
	MyTrello: Custom API wrapper for Trello
**********************************************************************************/ 

const MyTrello = {

	endpoint: "https://api.trello.com/1",
	key: "78824f4a41b17e3ab87a2934fd5e9fbb",
	token: "18616dd5585620de70fae4d1b6a4463a553581ec9aa7e211aaac45ec1d2707a3",

	board_id: "5fdfd980e5fd1b0cd5218f6a",
	wager_field: "5fe16b535ffa5a62d5f64550",
	list_id: undefined,

	authorizeTrello: function(){ return true; },
	// authorizeTrello: function(){
	// 					let authorized = false;
	// 					Trello.authorize({
	// 						type: 'popup',
	// 						name: 'Jeopardy',
	// 						persist: true,
	// 						interactive: false,
	// 						scope: {	read: 'true', write: 'true' },
	// 						expiration: 'never',
	// 						success: function(data) { authorized = true; Logger.log("Trello is Authorized"); },
	// 						error: function(data) { alert("Trello NOT authorized"); Logger.errorHandler(data) }
	// 					});
	// 					return authorized;
	// 				},

	// Get list of boards
	get_boards: function(successCallback){
		let trello_path = `${this.endpoint}/members/me/boards?key=${this.key}&token=${this.token}`
		myajax.AJAX({ method: "GET", path : trello_path, success: successCallback, failure : Logger.errorHandler});
	},

	// Get Custom Fields
	get_custom_fields: function(successCallback){
		let trello_path = `${this.endpoint}//boards/${this.board_id}/customFields?key=${this.key}&token=${this.token}`
		myajax.AJAX({ method: "GET", path : trello_path, success: successCallback, failure : Logger.errorHandler});
	},

	// Gets a single trello cards
	get_single_card: function(card_id, successCallback){
						let trello_path = `${this.endpoint}/cards/${card_id}/?key=${this.key}&token=${this.token}`;
						myajax.AJAX({ method: "GET", path : trello_path, success: successCallback, failure : Logger.errorHandler});
						// Trello.cards.get(card_id, successCallback, Logger.errorHandler);
					},
	// Gets a single trello cards
	get_card_actions: function(card_id, successCallback){
						let trello_path = `${this.endpoint}/cards/${card_id}/actions/?key=${this.key}&token=${this.token}`;
						myajax.AJAX({ method: "GET", path : trello_path, success: successCallback, failure : Logger.errorHandler});
						// Trello.cards.get(card_id, successCallback, Logger.errorHandler);
					},
	

	// Get a list of Trello Cards
	get_cards: function(successCallback){
					// Trello.get("/lists/"+this.list_id+"/cards", successCallback, Logger.errorHandler);
					let trello_path = `${this.endpoint}/lists/${this.list_id}/cards?key=${this.key}&token=${this.token}`;
					myajax.AJAX({ method: "GET", path : trello_path, success: successCallback, failure : Logger.errorHandler});
				},

	// Creates a new Trello Card
	create_card: function(team_name, successCallback){
					// var new_team_obj = {
					// 	name: team_name, 
					// 	// desc: "",
					// 	idList: this.list_id,
					// 	pos: 'top'
					// };
					let params = `name=${team_name}&idList=${this.list_id}&pos=top`;
					let trello_path = `${this.endpoint}/cards/?key=${this.key}&token=${this.token}&${params}`
					myajax.AJAX({ method: "POST", path : trello_path, data:"", success: successCallback, failure : Logger.errorHandler});
					// Trello.post('/cards/', new_team_obj, successCallback);
				},

	// Update a single card
	update_card: function(card_id, new_desc){
					let param = `desc=${new_desc}`;
					let trello_path = `${this.endpoint}/cards/${card_id}/?key=${this.key}&token=${this.token}&${param}`;
					myajax.AJAX({ method: "PUT", path : trello_path, failure : Logger.errorHandler});
						// Trello.cards.get(card_id, successCallback, Logger.errorHandler);
					// Trello.put('/cards/'+card_id, {desc: new_desc})
				},


	// Update a single card
	update_card_wager: function(card_id, wager){
					let param = `text=${wager}`;
					let trello_path = `${this.endpoint}/cards/${card_id}/actions/comments?key=${this.key}&token=${this.token}&${param}`;
					myajax.AJAX({ method: "POST", path : trello_path, data:"", failure : Logger.errorHandler});
				},

	// Get the latest wager (i.e. comment)

	// Gets the set of Trello Lists
	get_lists: function(successCallback){
					let trello_path = `${this.endpoint}/boards/${this.board_id}/lists?key=${this.key}&token=${this.token}`;
					// Trello.get("/boards/"+this.board_id+"/lists", successCallback, Logger.errorHandler);
					// Trello.get(path, successCallback, Logger.errorHandler);
					myajax.AJAX({ method: "GET", path : trello_path, success: successCallback, failure : Logger.errorHandler});
				},

	// Create a new list
	create_list: function(listName,successCallback){
					let param = `name=${listName}`
					// var new_list_obj = {
					// 	name:listName
					// };
					let trello_path = `${this.endpoint}/boards/${this.board_id}/lists?key=${this.key}&token=${this.token}&${param}`
					myajax.AJAX({ method: "POST", path : trello_path, data:"", success: successCallback, failure : Logger.errorHandler});
					// Trello.post("/boards/"+this.board_id+"/lists", new_list_obj, successCallback);
				},
}

// function trello_api(entity, identifier=undefined){
// 	if (entity.toLowerCase() !== "boards" && identifier == undefined ){
// 		console.error("Could not run a Trello query! No Identifier provided!");
// 	} else {
// 		var apiURI; 
// 		switch(entity){
// 			case "boards":
// 				apiURI = "/members/me/boards";
// 				break;
// 			case "lists":
// 				let boardID = identifier;
// 				apiURI ="/boards/"+boardID+"/lists"; 
// 				break;
// 			case "customFieldsOnBoard":
// 				let boardID2 = identifier;
// 				apiURI = "/boards/"+boardID2+"/customFields"; 
// 				break;
// 			case "cards":
// 				let listID = identifier; 
// 				apiURI ="/lists/"+listID+"/cards"; 
// 				// Trello.get("/lists/"+idVal+"/cards?fields=name&customFieldItems=true", print);
// 				break;
// 			case "customFieldsOnCards":
// 				let cardID2 = identifier; 
// 				apiURI = "/cards/"+cardID2+"/?fields=name&customFieldItems=true";
// 				break;
// 			default:
// 				console.error("Did not get anything! Tried - " + entity);
// 				apiURI = "n/a";
// 		}

// 		//  Return a promise with the results of the API call. 
// 		return Trello.get(apiURI).then( 
// 			function(payload){ return payload }, 
// 			function(error){ return error; } 
// 		);
// 	}
// 		}