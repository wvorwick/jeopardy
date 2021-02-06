

/*********************************************************************************
	PLAYER: GETTING STARTED
**********************************************************************************/ 

	mydoc.ready(function(){
		// Check for existing player if on player screen
		let path = location.pathname;

		if (path.includes("/team"))
		{
			let query_map = mydoc.get_query_map();
			if(query_map.hasOwnProperty("teamid"))
			{
				let card_id = query_map["teamid"]
				get_existing_team(card_id);
			} 
			else 
			{
				mydoc.showContent("#enter_game_code_section");
			}
		}
	});
	
	// Looks up the lists from the board and tries to find the one matching the given game code
	function lookup_game()
	{
		let code_input = document.getElementById("player_game_code");
		let code = code_input.value;

		MyTrello.get_lists(function(data)
		{
			Logger.log(data);
			let matching_list = undefined;

			response = JSON.parse(data.responseText);
			response.forEach(function(obj)
			{
				let game_name = obj["name"];
				if(game_name.toUpperCase() == code.toUpperCase())
				{
					matching_list = obj["id"];
				}
			});

			if (matching_list != undefined)
			{
				MyTrello.set_current_game_list(matching_list);
				Logger.log("Setting current team list ID: " + MyTrello.current_game_list_id);
				disable_step_one();
				mydoc.showContent("#enter_team_name_section");
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
		mydoc.hideContent("#enter_game_code_section");
		mydoc.hideContent("#enter_team_name_section");

		// Show the section to enter answers
		mydoc.showContent("#enter_answers_section");
	}

	function onFinalJeopardy()
	{
		mydoc.hideContent("#show_wager_link");
		mydoc.showContent("#wager" );
	}

/*********************************************************************************
	TEAM ACTIONS
**********************************************************************************/ 

	function create_team()
	{
		// Disable the button and show loading gif;
		document.getElementById("create_team_button").disabled = true;
		mydoc.showContent("#loading_gif");

		let team_input = document.getElementById("team_name");
		let team_name = team_input.value;

		let existing_team_id = undefined;
		
		// Check for existing cards before creating a new card; Match on name
		MyTrello.get_cards(MyTrello.current_game_list_id, function(data){

			response = JSON.parse(data.responseText);
			response.forEach(function(obj)
			{
				let card_name = obj["name"];
				if (card_name.toUpperCase() == team_name.toUpperCase())
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
				MyTrello.create_card(MyTrello.current_game_list_id, team_name, function(data)
				{
					response = JSON.parse(data.responseText);
					team_id = response["id"];

					load_url = "http://" + location.host + location.pathname + "?teamid=" + team_id;
					location.replace(load_url);

				});
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
		if( !isNaN(Number(wager)))
		{
			MyTrello.update_card_custom_field(card_id,MyTrello.custom_field_wager, wager.toString() )
			document.getElementById("submitted_wager_section").classList.remove("hidden");
			document.getElementById("submitted_wager_value").innerText = wager;
		}
		else
		{
			alert("Invalid wager value! Please enter a number");
		}
	}


	// Prevent the page accidentally closing
	function onClosePage(event)
	{
		event.preventDefault();
		event.returnValue='';
	}

