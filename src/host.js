


var CURR_GAME_ID =  "";
var CURR_GAME_NAME = "";
var CURR_GAME_URL =  "";
var CURR_SHEET_URL = "";
var CURR_GAME_PASSWORD = "";

/*********************************************************************************
	HOST: ON PAGE LOAD
**********************************************************************************/ 
	
	mydoc.ready(function(){

		// Check for existing player if on player screen
		let path = location.pathname;

		if (path.includes("/host/edit"))
		{

			let query_map = mydoc.get_query_map();
			if(query_map.hasOwnProperty("gameid"))
			{
				let game_id = query_map["gameid"];
				get_existing_game(game_id);
			} 
			else 
			{
				mydoc.show_section("enter_game_name_section");
			}
		}

		// If gameid is set, avoid accidentally exiting
		if(path.includes("?gameid"))
		{
			// Prevent accidental closing
			window.addEventListener("beforeunload", onClosePage);
		}
	});

	// Prevent the page accidentally closing
	function onClosePage(event)
	{
		event.preventDefault();
		event.returnValue='';
	}


/*********************************************************************************
	HOST: PLAY EXISTING GAME (to play)
**********************************************************************************/ 
	
	function load_game_from_trello(isTestRun=false)
	{

		let test_param = (isTestRun) ? "&test=1" : "";

		// Clear loading results
		set_loading_results("");
		// Show the loading section
		toggle_loading_gif();

		try
		{
			let game_name_ele = document.getElementById("game_name_to_load");
			let given_game_name = game_name_ele.value;
			
			MyTrello.get_cards(MyTrello.admin_list_id, function(data){
				response = JSON.parse(data.responseText);

				let game_id    = undefined;
				response.forEach(function(card){
					let card_name = card["name"];
					let card_id   = card["id"];

					if(card_name.toLowerCase() == given_game_name.toLowerCase())
					{
						game_id = card_id
					}
				});
				
				if(game_id != undefined)
				{
					let path = "/board/?gameid=" + game_id + test_param;
					let href = "http://" + location.host + location.pathname.replace("/host/play.html",path);
					location.replace(href);
				}
			});
		}
		catch(error)
		{
			set_loading_results("Sorry, something went wrong!\n\n"+error);
		}
	}
	
/*********************************************************************************
	HOST: ENTER DETAILS TO EXISTING GAME
**********************************************************************************/ 

	// Looks up the lists from the board and tries to find the one matching the given game code
	function load_game()
	{
		// Start loading GIF and clear results (if any);
		toggle_loading_gif();
		document.getElementById("loading_results_section").innerText = "";

		let game_name_ele = document.getElementById("given_game_name");
		let given_name = game_name_ele.value;

		let game_password_ele = document.getElementById("given_game_password");
		let given_password = game_password_ele.value;

		MyTrello.get_cards(MyTrello.admin_list_id, function(data)
		{
			let matching_game_id = undefined;
			response = JSON.parse(data.responseText);

			response.forEach(function(obj)
			{
				let game_name = obj["name"];
				if(game_name.toUpperCase() == given_name.toUpperCase())
				{
					matching_game_id = obj["id"];
				}
			});

			if (matching_game_id != undefined)
			{

				CURR_GAME_ID = matching_game_id;
				validate_password(matching_game_id,given_password, function(){
					// mydoc.show_section("enter_team_name_section");
					load_url = "http://" + location.host + location.pathname + "?gameid=" + CURR_GAME_ID;
					location.replace(load_url);
				});
			}
			else 
			{
				toggle_loading_gif(true);
				result = "Could not find a game with the given name!";
				document.getElementById("loading_results_section").innerText = result;
			}
		});
	}


	function validate_password(game_id, password, callback)
	{

		MyTrello.get_card_custom_fields(game_id, function(data){
			response = JSON.parse(data.responseText);

			failure = true;			
			response.forEach(function(obj){
				let valueObject = obj["value"];
				let is_phrase_field = obj["idCustomField"] == MyTrello.custom_field_phrase;
				let value = (valueObject.hasOwnProperty("text")) ? valueObject["text"] : "";
				
				if(is_phrase_field && value != "")
				{
					if(value.toUpperCase() == password.toUpperCase())
						{
							failure = false;
							callback();
						}
				}
			});
			if(failure)
			{
				toggle_loading_gif(true);
				result = "Invalid credentials for this game";
				document.getElementById("loading_results_section").innerText = result;
			}
		});
	}



/*********************************************************************************
	HOST: EDITING EXISTING GAME
**********************************************************************************/ 

	function delete_media(mediaID)
	{
		remove_existing_media_from_page(mediaID);

		MyTrello.delete_attachment(CURR_GAME_ID, mediaID, function(data){
			response = JSON.parse(data.responseText);
		});
	}

	// Loads existing team if card ID was already included or found
	function get_existing_game(card_id)
	{
		MyTrello.get_single_card(card_id, function(data){
			response = JSON.parse(data.responseText);
			
			CURR_GAME_ID = response["id"];
			CURR_GAME_NAME = response["name"];
			CURR_GAME_URL = response["desc"];

			let path = "/board/?gameid=" + CURR_GAME_ID;
			
			let hrefPlay = "http://" + location.host + location.pathname.replace("/host/edit.html",path);
			let hrefTest = hrefPlay + "&test=1";

			document.getElementById("test_game_button").href = hrefTest;
			document.getElementById("play_game_button").href = hrefPlay;

			// Get password, and then callback to show game page
			get_existing_password(CURR_GAME_ID, show_game_page);
			get_existing_media(CURR_GAME_ID);
			get_existing_edit_sheet_url(CURR_GAME_ID);
			// show_game_page();
		});
	}

	function get_existing_media(card_id)
	{
		MyTrello.get_card_attachments(card_id, function(data){
			response = JSON.parse(data.responseText);

			response.sort(function(a,b){
				if(a["fileName"] < b["fileName"])
				{
					return -1;
				}
				if(a["fileName"] > b["fileName"])
				{
					return 1;
				}

				return 0;
			});

			response.forEach(function(obj){
				file_name = obj["fileName"];
				file_url  = obj["url"];
				file_id   = obj["id"];

				add_existing_media_to_page(file_id, file_name, file_url);
			});
		});
	}

	function get_existing_edit_sheet_url(card_id)
	{
		MyTrello.get_card_custom_fields(card_id, function(data){
			response = JSON.parse(data.responseText);

			response.forEach(function(obj){
				let valueObject = obj["value"];
				let is_sheet_field = obj["idCustomField"] == MyTrello.custom_field_sheet;
				let value = (valueObject.hasOwnProperty("text")) ? valueObject["text"] : "";
				
				if(is_sheet_field && value != "")
				{
					CURR_SHEET_URL = value;
					document.getElementById("game_edit_sheet_value").value = value;
					document.getElementById("go_to_edit_sheet").href = value;
					document.getElementById("go_to_edit_sheet").innerText = "Go to Edit Sheet";
				}
			});
		});
	}

	function get_existing_password(game_id, callback=undefined)
	{

		MyTrello.get_card_custom_fields(game_id, function(data){
			response = JSON.parse(data.responseText);

			response.forEach(function(obj){
				let valueObject = obj["value"];
				let is_phrase_field = obj["idCustomField"] == MyTrello.custom_field_phrase;
				let value = (valueObject.hasOwnProperty("text")) ? valueObject["text"] : "";
				
				if(is_phrase_field && value != "")
				{
					CURR_GAME_PASSWORD = value;
					document.getElementById("game_pass_phrase").value = CURR_GAME_PASSWORD;
				}

				if(callback!=undefined)
				{
					callback();
				}
			});
		});


		// MyTrello.get_card_actions(game_id, function(data){
		// 	response = JSON.parse(data.responseText);

		// 	if (response.length > 0)
		// 	{
		// 		sorted = response.sort(function(a, b){
		// 			d1 = new Date(a["date"])
		// 			d2 = new Date(b["date"])
		// 			return d1 < d2
		// 		});

		// 		latest_password = sorted[0];

		// 		CURR_GAME_PASSWORD = latest_password.data.text;

		// 		document.getElementById("game_pass_phrase").value = CURR_GAME_PASSWORD;
		// 	}
		// 	if(callback!=undefined)
		// 	{
		// 		callback();
		// 	}
		// });
	}

	function save_game()
	{
		// Get the elements
		let save_button = document.getElementById("save_game_button");
		let game_name = document.getElementById("game_name_value");
		let game_password = document.getElementById("game_pass_phrase");
		let game_url = document.getElementById("game_url_value");
		let game_edit_url = document.getElementById("game_edit_sheet_value");

		// Disable all inputs
		save_button.disabled = true;
		game_name.disabled = true;
		game_password.disabled = true;
		game_url.disabled = true;

		// Show the loading GIF
		toggle_saving_gif();

		// Update name if it is set & 
		if(game_name.value != undefined && (CURR_GAME_NAME != game_name.value))
		{
			MyTrello.update_card_name(CURR_GAME_ID, game_name.value);
			CURR_GAME_NAME = game_name.value;
		}

		// Only add a new password if different from the last
		if( game_password.value != undefined && (CURR_GAME_PASSWORD != game_password.value))
		{
			// MyTrello.add_card_comment(CURR_GAME_ID, game_password.value);
			MyTrello.update_card_custom_field(CURR_GAME_ID,MyTrello.custom_field_phrase,game_password.value)
			CURR_GAME_PASSWORD = game_password.value;
		}

		// Update the game URL (i.e. the description)
		if( game_url.value != undefined && (CURR_GAME_URL != game_url.value))
		{
			MyTrello.update_card(CURR_GAME_ID, game_url.value);
			CURR_GAME_URL = game_url.value;
		}

		if (game_edit_url.value != undefined && (CURR_SHEET_URL != game_edit_url.value))
		{
			MyTrello.update_card_custom_field(CURR_GAME_ID,MyTrello.custom_field_sheet,game_edit_url.value)
			CURR_SHEET_URL = game_edit_url.value;			
		}

		setTimeout(function(){
			save_button.disabled = false;
			game_name.disabled = false;
			game_password.disabled = false;
			game_url.disabled = false;

			toggle_saving_gif(true);
		}, 2000);
	}



/*********************************************************************************
	DOCUMENT OBJECT MODEL
**********************************************************************************/ 

	function add_existing_media_to_page(fileID, fileName, fileURL)
	{
		let game_media_list = document.getElementById("game_media");

		link = `<a href='${fileURL}' target="_blank">${fileName}</a>`;
		del  = `<i onclick="delete_media('${fileID}')" class="delete_media fa fa-trash"></i>`;
		row = `<li id="${fileID}">${link} &nbsp; ${del}</li>`;
		game_media_list.innerHTML += row;
	}

	function remove_existing_media_from_page(fileID)
	{
		try
		{
			document.getElementById(fileID).remove();
		} 
		catch(err)
		{
			Logger.log(err);
		}
	}

	// Loading view
	function toggle_loading_gif(forceHide=false)
	{
		let section = document.getElementById("loading_gif");
		let isHidden = section.classList.contains("hidden")

		if(isHidden)
		{
			mydoc.show_section("loading_gif");		
		}
		if(!isHidden || forceHide)
		{
			mydoc.hide_section("loading_gif");	
		}
	}

	// Saving gif;
	function toggle_saving_gif(forceHide=false)
	{
		let section = document.getElementById("saving_gif");
		let isHidden = section.classList.contains("hidden")

		if(isHidden)
		{
			mydoc.show_section("saving_gif");		
		}
		if(!isHidden || forceHide)
		{
			mydoc.hide_section("saving_gif");	
		}
	}

	function set_loading_results(value)
	{
		toggle_loading_gif(true);
		let section = document.getElementById("loading_results_section");
		section.innerText = value;
	}


/*********************************************************************************
	HOST: CREATE GAME
**********************************************************************************/ 

	// Validate New Game
	function validate_new_game()
	{
		Logger.log("Create Game");
		document.getElementById("loading_results_section").innerText = "";

		toggle_loading_gif();

		let game_name = document.getElementById("given_game_name").value;
		let pass_phrase = document.getElementById("given_pass_phrase").value;

		let has_game_name = (game_name != undefined && game_name != "");
		let has_pass_phrase = (pass_phrase != undefined && pass_phrase != "");

		if(has_game_name && has_pass_phrase)
		{
			MyTrello.get_cards(MyTrello.admin_list_id, function(data){
				response = JSON.parse(data.responseText);

				let name_already_exists = false;
				response.forEach(function(obj){
					card_name = obj["name"];
					if(card_name.toLowerCase() == game_name.toLowerCase())
					{
						name_already_exists = true;
					}
				});

				if(!name_already_exists)
				{
					create_game(game_name, pass_phrase);
				}
				else
				{
					results = "Cannot Use This Game Name!<br/> Name Already Exists!";
					document.getElementById("loading_results_section").innerHTML = results;
					toggle_loading_gif(true);

				}
			});
		}
		else
		{
			results = "Please enter a game name and a pass phrase!";
			document.getElementById("loading_results_section").innerHTML = results;
			toggle_loading_gif(true);
		}	
	}

	// Create the new game;
	function create_game(game_name, pass_phrase)
	{
		MyTrello.create_card(MyTrello.admin_list_id, game_name, function(data)
		{
			response = JSON.parse(data.responseText);
			game_id = response["id"];

			// Add the pass to the custom field
			MyTrello.update_card_custom_field(game_id,MyTrello.custom_field_phrase,pass_phrase)


			setTimeout(function(){
				load_url = "http://" + location.host + location.pathname.replace("create", "edit") + "?gameid=" + game_id;
				location.replace(load_url);
			}, 2000);
		});
	}

	function add_media()
	{
		var files = document.getElementById("game_files").files;

		for(var idx = 0; idx < files.length; idx++)
		{
			var fileData = new FormData();

			fileData.append("key", MyTrello.key);
			fileData.append("token", MyTrello.token);
			fileData.append("file", files[idx]);
			fileData.append("name", files[idx].name);
			fileData.append("setCover", false);

			MyTrello.create_attachment(CURR_GAME_ID, fileData, function(data){

				response = JSON.parse(data.responseText);

				file_name = response["fileName"];
				file_url  = response["url"];
				file_id   = response["id"];

				add_existing_media_to_page(file_id, file_name, file_url);
			});
		}		
	}

/*********************************************************************************
	SECTION VISIBILITY 
**********************************************************************************/ 

	// Shows the section for submitting answers
	function show_game_page()
	{
		// Set Team Identifiers
		document.getElementById("game_name_value").value = CURR_GAME_NAME;
		document.getElementById("game_url_value").value = CURR_GAME_URL;

		// First, hide starter sects
		mydoc.hide_section("enter_game_name_section");

		// Show the section to enter answers
		mydoc.show_section("edit_game_section");
	}


/*********************************************************************************
	EDIT GAME ACTIONS
**********************************************************************************/ 

	

