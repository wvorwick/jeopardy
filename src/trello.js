
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

	current_game_list_id: "",
	demo_list_id: "5fdfd980e5fd1b0cd5218f6d",
	test_list_id: "60115ebf2caf916afa9cc107",
	admin_list_id: "6007bbc9ec73367514314430",

	authorizeTrello: function(){ return true; },

	/*** Admin Calls ***/

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

	/*** Helper Functions ***/

	set_current_game_list: function(listID){
		this.current_game_list_id = listID;
	},


	/*** API Wrapper Calls ***/

	// Gets a single trello cards
	get_single_card: function(card_id, successCallback){
						let trello_path = `${this.endpoint}/cards/${card_id}/?key=${this.key}&token=${this.token}`;
						myajax.AJAX({ method: "GET", path : trello_path, success: successCallback, failure : Logger.errorHandler});
					},
	// Gets a single trello card's actions
	get_card_actions: function(card_id, successCallback){
						let trello_path = `${this.endpoint}/cards/${card_id}/actions/?key=${this.key}&token=${this.token}`;
						myajax.AJAX({ method: "GET", path : trello_path, success: successCallback, failure : Logger.errorHandler});
					},

	// Gets a single trello card's actions
	get_card_attachments: function(card_id, successCallback){
						let trello_path = `${this.endpoint}/cards/${card_id}/attachments/?key=${this.key}&token=${this.token}`;
						myajax.AJAX({ method: "GET", path : trello_path, success: successCallback, failure : Logger.errorHandler});
					},

	// Create attachments on a card
	create_attachment: function(cardID, fileData, successCallback){
		// let params = `name=${fileName}&mimeType=${fileType}&file=${fileData}`
		let trello_path = `${this.endpoint}/cards/${cardID}/attachments`;
		// ?key=${this.key}&token=${this.token}}&${params}`;
		myajax.AJAX({ method:"POST", path:trello_path, data:fileData, success:successCallback, failure:Logger.errorHandler});		
	},
	
	delete_attachment: function(cardID, attachmentID, successCallback){
		let trello_path = `${this.endpoint}/cards/${cardID}/attachments/${attachmentID}?key=${this.key}&token=${this.token}`;
		myajax.AJAX({ method:"DELETE", path:trello_path, success:successCallback, failure:Logger.errorHandler});		
	},

	// Get a list of Trello Cards
	get_cards: function(listID, successCallback){
		let trello_path = `${this.endpoint}/lists/${listID}/cards?key=${this.key}&token=${this.token}`;
		myajax.AJAX({ method: "GET", path : trello_path, success: successCallback, failure : Logger.errorHandler});
	},

	// Creates a new Trello Card
	create_card: function(listID, team_name, successCallback){
		let params = `name=${team_name}&idList=${listID}&pos=top`;
		let trello_path = `${this.endpoint}/cards/?key=${this.key}&token=${this.token}&${params}`
		myajax.AJAX({ method: "POST", path : trello_path, data:"", success: successCallback, failure : Logger.errorHandler});
	},

	// Update a single card
	update_card: function(card_id, new_desc){
		let param = `desc=${new_desc}`;
		let trello_path = `${this.endpoint}/cards/${card_id}/?key=${this.key}&token=${this.token}&${param}`;
		myajax.AJAX({ method: "PUT", path : trello_path, failure : Logger.errorHandler});
	},

	update_card_name: function(card_id, new_name){
		let param = `name=${new_name}`;
		let trello_path = `${this.endpoint}/cards/${card_id}/?key=${this.key}&token=${this.token}&${param}`;
		myajax.AJAX({ method: "PUT", path : trello_path, failure : Logger.errorHandler});
	},


	// Update a single card
	add_card_comment: function(card_id, comment){
		let param = `text=${comment}`;
		let trello_path = `${this.endpoint}/cards/${card_id}/actions/comments?key=${this.key}&token=${this.token}&${param}`;
		myajax.AJAX({ method: "POST", path : trello_path, data:"", failure : Logger.errorHandler});
	},

	// Get the latest wager (i.e. comment)

	// Gets the set of Trello Lists
	get_lists: function(successCallback){
		let trello_path = `${this.endpoint}/boards/${this.board_id}/lists?key=${this.key}&token=${this.token}`;
		myajax.AJAX({ method: "GET", path : trello_path, success: successCallback, failure : Logger.errorHandler});
	},

	// Create a new list
	create_list: function(listName,successCallback){
		let param = `name=${listName}`
		let trello_path = `${this.endpoint}/boards/${this.board_id}/lists?key=${this.key}&token=${this.token}&${param}`
		myajax.AJAX({ method: "POST", path : trello_path, data:"", success: successCallback, failure : Logger.errorHandler});
	},
}