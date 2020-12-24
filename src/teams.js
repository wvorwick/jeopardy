
// const trelloBoardID = "5fdfd980e5fd1b0cd5218f6a";
// var trelloListId = undefined;

// var demo = document.getElementById("demo");

/*********************************************************************************
	PLAYER: GETTING STARTED
**********************************************************************************/ 

	document.addEventListener("DOMContentLoaded", get_started_teams);

	function get_started_teams()
	{

		// // Make sure the page doesn't close once the game starts
		// window.addEventListener("beforeunload", onClosePage);

		// Check for existing player if on player screen
		let path = location.pathname;
		let query = location.search;

		if (path.includes("/team"))
		{
			let query_map = get_query_map(query);
			if(query_map.hasOwnProperty("teamid"))
			{
				let card_id = query_map["teamid"]
				get_existing_team(card_id);
			} 
			else 
			{
				mydoc.show_section("enter_game_code_section");
				// show_create_team_sections();
			}
		}
		// // Authorize first
		// let isAuthorized = MyTrello.authorizeTrello()

		// if(isAuthorized)
		// {
		// 	// Hide the authentication section
		// 	// mydoc.hide_section("authenticate_section");

			
		// }
	}
	
	// Helper: Formats the query string to get any query srings
	function get_query_map(query_string)
	{
		let query = query_string.replace("?", "")
		var query_map = {}
		var combos = query.split("&");
		combos.forEach(function(obj)
		{
			let splits = obj.split("=");
			query_map[splits[0]] = splits[1];
		});
		return query_map;
	}

	// Looks up the lists from the board and tries to find the one matching the given game code
	function lookup_game()
	{
		let code_input = document.getElementById("player_game_code");
		let code = code_input.value.toUpperCase();

		MyTrello.get_lists(function(data)
		{
			Logger.log(data);
			let matching_list = undefined;

			response = JSON.parse(data.responseText);
			response.forEach(function(obj)
			{
				let game_name = obj["name"];
				if(game_name == code)
				{
					matching_list = obj["id"];
				}
			});

			if (matching_list != undefined)
			{
				MyTrello.list_id = matching_list;
				// trelloListId = matching_list;
				console.log("List ID");
				console.log(MyTrello.list_id );

				disable_step_one();
				mydoc.show_section("enter_team_name_section");
			}
			else 
			{
				alert("Could NOT find a game with code: " + code);
			}
		});
	}


	// Loads existing team if card ID was already included or found
	function get_existing_team(card_id)
	{
		MyTrello.get_single_card(card_id, function(data){
			response = JSON.parse(data.responseText);
			// console.log("GOT CARD");
			team_id = response["id"];
			team_name = response["name"];
			show_team_page(team_name, team_id);
		});
	}



/*********************************************************************************
	SECTION VISIBILITY 
**********************************************************************************/ 

	// Disables the button and input once a game is found;
	function disable_step_one(){
		document.querySelector("#enter_game_code_section button").style.display = "none";
		document.querySelector("#enter_game_code_section input").disabled = true;
	}

	// Shows the section for submitting answers
	function show_team_page(team_name, team_id)
	{
		// Set Team Identifiers
		document.getElementById("team_code").innerText = team_name;
		document.getElementById("team_card_id").value = team_id;

		// First, hide starter sects
		mydoc.hide_section("enter_game_code_section");
		mydoc.hide_section("enter_team_name_section");

		// Show the section to enter answers
		mydoc.show_section("enter_answers_section");
	}

	function onFinalJeopardy()
	{
		mydoc.hide_section("show_wager_link");
		mydoc.show_section("wager" );
		// document.getElementById("wager").classList.remove("hidden");
	}

/*********************************************************************************
	TEAM ACTIONS
**********************************************************************************/ 

	function create_team()
	{
		let team_input = document.getElementById("team_name");
		let team_name = team_input.value;

		let existing_team_id = undefined;
		
		// Check for existing cards before creating a new card; Match on name
		MyTrello.get_cards(function(data){

			response = JSON.parse(data.responseText);
			response.forEach(function(obj)
			{
				let card_name = obj["name"];
				if (card_name == team_name)
				{
					existing_team_id = obj["id"];
				}
			});

			if(existing_team_id != undefined)
			{
				Logger.log("Loading Existing Card");
				load_url = "http://" + location.host + location.pathname + "?teamid=" + existing_team_id;
				location.replace(load_url);
			}
			else
			{
				Logger.log("Creating new card");
				MyTrello.create_card(team_name, function(data)
				{
					response = JSON.parse(data.responseText);
					team_id = response["id"];

					// setTimeout(function(){
					load_url = "http://" + location.host + location.pathname + "?teamid=" + team_id;
					location.replace(load_url);
					// }, 1000)
					
					// show_team_answer_sect(team_name, team_id);

				}, Logger.errorHandler)
			}

		}, Logger.errorHandler);
	}

	function submit_answer()
	{
		let card_id = document.getElementById("team_card_id").value;
		let answer = document.getElementById("answer").value;
			document.getElementById("answer").value = "";
		let wager = document.getElementById("wager").value;
			document.getElementById("wager").value = "";


		MyTrello.update_card(card_id, answer);	
		document.getElementById("submitted_answer_section").classList.remove("hidden");
		document.getElementById("submitted_answer_value").innerText = answer;

		// Attempt to submit wager as well
		if(wager != "" && Number.isInteger(Number(wager)))
		{
			submit_wager(card_id, String(wager));
		}
	}

	function submit_wager(card_id, wager)
	{
		MyTrello.update_card_wager(card_id, wager);
		document.getElementById("submitted_wager_section").classList.remove("hidden");
		document.getElementById("submitted_wager_value").innerText = wager;

	}


	// Prevent the page accidentally closing
	function onClosePage(event)
	{
		event.preventDefault();
		event.returnValue='';
	}

