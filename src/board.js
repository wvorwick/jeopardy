
/********************************************************************************
	GLOBAL VARIABLES 
*********************************************************************************/

	var teams_added = [];
	var current_team_idx = -1;

	var JeopardyGame = undefined;

	var QA_MAP = {};   //The Question-Answer map;
	var GAME_NAME  = "Home-made Jeopardy";
	var GAME_MEDIA = {};

/********************************************************************************
	GETTING STARTED
*********************************************************************************/

	mydoc.ready(function(){
		// Make sure the page doesn't close once the game starts
		window.addEventListener("beforeunload", onClosePage);

		// Set the game board listeners
		game_board_listeners();

		// Load the additional views
		load_views();

		// Set timer callback
		if(Timer)
		{
			Timer.setTimeUpCallback(function(){
				document.getElementById("time_up_sound").play();
			});
		}
	});

	function game_board_listeners()
	{
		document.addEventListener("keyup", function(event)
		{
			switch(event.code)
			{
				case "Escape":
					onCloseQuestion();
					break;
				case "ControlLeft":
				case "ControlRight":
					if(Timer != undefined)
					{
						Timer.startTimer();
					}
					else
					{
						Timer.resetTimer();
					}
					break;
				default:
					return;
			}
		});
	}

	function load_views(){
		$("#menu_section").load("../views/menu.html");
		$("#rules_section").load("../views/rules.html");
		$("#game_board_section").load("../views/board.html");
		$("#teams_section").load("../views/teams.html");
		$("#timer_section").load("../views/timer.html");
		$("#show_question_section").load("../views/showQuestion.html", function(data){
			// Set listeners for closing question
			var close_button = document.getElementById("close_question_view");
			close_button.addEventListener("click", onCloseQuestion);
		});
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

	// Set loading results
	function set_loading_results(value)
	{
		toggle_loading_gif(true);
		let section = document.getElementById("loading_results_section");
		section.innerText = value;
	}

	// Get the cards
	function load_game_from_trello()
	{

		// Clear loading results
		set_loading_results("");

		let game_name_ele = document.getElementById("game_name_to_load");
		
		// Show the loading section
		toggle_loading_gif();

		try
		{
			let given_game_name = game_name_ele.value;

			MyTrello.get_cards(MyTrello.admin_list_id, function(data){
				response = JSON.parse(data.responseText);

				game_found = false;
				response.forEach(function(card){

					let name = card["name"];
					if(name.toLowerCase() == given_game_name.toLowerCase())
					{
						game_found = true;
						GAME_NAME = name;
						// card_id = obj["id"];
						// url_value = obj["desc"].trim();
						load_attachments_from_trello(card);
					}
				});
				if(!game_found){
					set_loading_results("Could not find game with that name!");
				}
			});
		}
		catch(error)
		{
			set_loading_results("Sorry, something went wrong!\n\n"+error);
		}
	}

	// Get the attachments on the card (if any)
	function load_attachments_from_trello(card)
	{
		let card_id = card["id"];
		let url_value = card["desc"].trim();

		MyTrello.get_card_attachments(card_id, function(data){

			response = JSON.parse(data.responseText);

			if(response.length > 0) //Process the attachments, then load the spreadsheet;
			{
				Logger.log("Loading attachments from card");
				response.forEach(function(obj){
					name = obj["fileName"];
					path = obj["url"];
					GAME_MEDIA[name] = path;
				});
				load_game_from_google(url_value);
			}
			else
			{
				Logger.log("No Attachments Included; Just loading Questions");
				load_game_from_google(url_value);
			}
		});
	}

	// Get the list of games from the spreadsheet
	function load_game_from_google(urlPath)
	{
		let response = "";

		myajax.AJAX(
	    	{
		      method: "GET",
		      path : urlPath,
		      cacheControl: "no-cache",
		      success: function(request){
		      	Logger.log("Got the Game Data from Google!");
		      	preprocess_game_sheet(request);
		      },
		      failure : function(request){
		      	Logger.log("Something went wrong when trying to get data from Google!");
		      	preprocess_game_sheet(request);
		      }
		    }
		);
	}

	// Validate if the game sheet matches the expected format
	function preprocess_game_sheet(data)
	{
		let rows = data.responseText.split("\n");
		let cols = rows[0].split("\t");
		if(rows.length == 32 && cols.length == 11)
		{
			// Remove the header row
			rows.shift();

			// Create the game;
			processed = create_jeopardy_game(rows);

			// If processed returns a valid 
			if(processed) { initialize_game() }
		}
		else
		{
			toggle_loading_gif(true);
			set_loading_results("ERROR: Your sheet is not valid. Please refer to the instructions/template for a valid sheet configuration.\n\n");
		}
	}

	// Get the game media based on a given value
	function get_game_media_url(value)
	{
		let url = "";
		if(GAME_MEDIA.hasOwnProperty(value))
		{
			url = GAME_MEDIA[value];
		}
		return url;
	}

	// Creates the Jeopardy game objects
	function create_jeopardy_game(data)
	{

		Logger.log("Creating Jeopardy Objects");
		JeopardyGame = new Jeopardy();

		data.forEach(function(row){

			let content = row.split("\t");
			
			let category 		= content[0];

			let value 			= content[1];
			let daily_double	= content[2];

			let question_text 	= content[3];
			let question_audio 	= get_game_media_url(content[4]);
			let question_image 	= get_game_media_url(content[5]);
			let question_url 	= content[6];
			let answer_text 	= content[7];
			let answer_audio 	= get_game_media_url(content[8]);
			let answer_image 	= get_game_media_url(content[9]);
			let answer_url 		= content[10];

			// Setup the new question
			let new_question = new Question(question_text, question_audio, question_image, question_url,
											answer_text, answer_audio, answer_image, answer_url,
											value, daily_double);

			if(JeopardyGame.categoryExists(category))
			{
				let theCategory = JeopardyGame.getCategory(category);
				theCategory.addQuestion(new_question);
			}
			else
			{
				let newCategory = new Category(category);
				newCategory.addQuestion(new_question);
				JeopardyGame.addCategory(newCategory);
			}
		});

		console.log(JeopardyGame);

		return (JeopardyGame != undefined);
	}


	// Handles setting up all the pieces for the game;
	function initialize_game()
	{
		// Check for "debug" flag
		let query_map = mydoc.get_query_map();
		let is_debugging = (query_map.hasOwnProperty("debug") && query_map["debug"]==1) ? true : false;


		// Set Game Name
		document.getElementById("game_name").innerHTML = GAME_NAME;

		// Creates the game table
		create_game_board();

		mydoc.hide_section("load_game_section");
		mydoc.hide_section("homemade_jeopardy_title");
		toggle_loading_gif();

		mydoc.show_section("game_section");

		// document.getElementById("load_game_section").classList.add("hidden");
		// document.getElementById("game_section2").classList.remove("hidden");
		addListenerCategoryClick();
		addListenerQuestionClick();

		// set the game code
		let game_code = (!is_debugging) ? getGameCode() : "DEMO";
		document.getElementById("game_code").innerHTML = game_code;

		// Either get the DEMO list or create a new list with the game code;
		if(is_debugging)
		{

			MyTrello.set_current_game_list(MyTrello.demo_list_id);
			Logger.log("Current Game List ID: " + MyTrello.current_game_list_id);
		} 
		else
		{
			MyTrello.create_list(game_code,function(data){
				response = JSON.parse(data.responseText);
				MyTrello.set_current_game_list(response["id"]);
				Logger.log("Current Game List ID: " + MyTrello.current_game_list_id);
			});
		}
	}


/********************************************************************************
	EVENT LISTENERS
*********************************************************************************/

	// Prevent the page accidentally closing
	function onClosePage(event)
	{
		event.preventDefault();
		event.returnValue='';
	}

	// Adds the listeners to the category columns once loaded
	function addListenerCategoryClick()
	{
		var categories = document.querySelectorAll(".category_title");
		categories.forEach(function(cell){
			cell.addEventListener("click", onCategoryClick);
		});
	}

	//Reveal the name of a category that is not visible yet
	function onCategoryClick(event)
	{
		// alert("Category Clicked");
		let element = event.target;
		let current_value = element.innerHTML;
		let title = element.getAttribute("data-jpd-category-name");
		if (title != current_value)
		{
			element.innerHTML = title;
		}
	}


	// Add listeners to the game cells;
	function addListenerQuestionClick()
	{
		var cells = document.querySelectorAll(".category_option");
		cells.forEach(function(cell){
			cell.addEventListener("click", onQuestionClick);
		});
	}

	
	// Open up the selected question	
	function onQuestionClick(event)
	{
		let ele = event.target;
		let td  = (ele.tagName == "TD") ? ele : ele.querySelectorAll(".category_option")[0];
		if (td != undefined)
		{
			loadQuestion(td);
		} 
		else{ alert("ERROR: Couldn't load question. The selected cell didn't register;"); } 
	}

	// Reveal the answer in the question popup; Also reveal player answers
	function onRevealAnswer(event)
	{
		
		var answers = document.querySelectorAll(".team_answer");

		for(var idx = 0; idx < answers.length; idx++)
		{
			let obj = answers[idx];
			let teamCode = obj.getAttribute("data-jpd-team-code");

			MyTrello.get_single_card(teamCode, function(data){
				response = JSON.parse(data.responseText);
				obj.innerHTML = response["desc"];
			});

			// Attempt to set teamCode
			if(isFinalJeopardy2())
			{
				setWager(teamCode);			
			}
		}

		// Show the sections
		mydoc.show_section("answer_block");
		mydoc.show_section("correct_block");
	}

	//Close the current question; Calls to reset timer, update turn, and clear answers
	function onCloseQuestion()
	{
		window.scrollTo(0,0); // Scroll back to the top of the page;
		updateScore();
		document.getElementById("answer_block").classList.add("hidden");
		document.getElementById("correct_block").classList.add("hidden");
		document.getElementById("question_view").classList.add("hidden");
		document.getElementById("team_list").innerHTML = ""; // Reset the list of teams, so that it doesn't stack up each time.
		Timer.resetTimer(); // make sure the timer is reset to default.
		onUpdateTurn(); // Pick whos turn it is next
		resetAnswers(); // Reset the answers for each team.
	}

	/*
	Purpose: 	Reveal the game board & set initial team to go
	Param(s): 	event object
	*/
	function onStartGame(event)
	{
		// Sync teams before starting game; True to select random player as well
		onSyncTeams(true);

		// Hide These things:
		mydoc.hide_section("rules_section");
		// mydoc.hide_section("startGameButton");
		
		//  Show these things:
		mydoc.show_section("teams_table");
		mydoc.show_section("round_1_row");
		mydoc.show_section("current_turn_section");
		mydoc.show_section("finalJeopardyButton");
		

		mydoc.show_section("current_turn_section");

		// document.getElementById("teams_table").classList.remove("hidden");
		// document.getElementById("round_1_row").classList.remove("hidden");
		// document.getElementById("current_turn_section").classList.remove("hidden");
		// document.getElementById("finalJeopardyButton").classList.remove("hidden");
		
		// Only used if multiple rounds are set;
		let nextRound = document.getElementById("next_round");
		if (nextRound != undefined)
		{
			nextRound.classList.remove("hidden");
		}

	}

	// Selects the next player
	function onUpdateTurn(random=false)
	{
		Logger.log("Updating Turn");

		numTeams  = teams_added.length;

		nextIdx = (random) ? Math.floor(Math.random() * numTeams) : current_team_idx+1;
		nextIdx = (nextIdx == numTeams) ? 0 : nextIdx;

		nextTeam = teams_added[nextIdx];
		document.getElementById("current_turn").innerText = nextTeam;

		// Update the index for next iteration
		current_team_idx = nextIdx;
	}

	// Show the next set of questions in the second round
	function onNextRound(event)
	{
		document.getElementById("next_round").classList.add("hidden");
		document.getElementById("round_1_row").classList.add("hidden");
		document.getElementById("round_2_row").classList.remove("hidden");
	}

	//Show the Final Jeopardy section
	function onShowFinalJeopardy()
	{
		// Hide these sections

		document.getElementById("round_1_row").classList.add("hidden");	
		document.getElementById("current_turn_section").classList.add("hidden");	

		let round2Row = document.getElementById("round_2_row");
		if (round2Row != undefined){ round2Row.classList.add("hidden"); }

		// Hide these things
		mydoc.hide_section("time_view_regular");
		mydoc.show_section("final_jeopardy_audio");

		// Show these things
		mydoc.show_section("final_jeopardy_audio");

		document.getElementById("final_jeopardy_row").classList.remove("hidden");
		document.getElementById("final_jeopardy_row").classList.add("final_jeopardy_row");

		document.getElementById("highest_score_wager").classList.remove("hidden");


		let wagerCells = document.getElementsByClassName("wager_row");
		for (let x = 0; x < wagerCells.length; x++) { wagerCells[x].classList.remove("hidden"); }

		var team_scores = document.querySelectorAll("span.team_score");
		let highest_score  = (team_scores.length > 0) ? team_scores[0].innerText : "0";
		document.getElementById("highest_score_value").innerText = highest_score;

		console.log(highest_score);

	}

	function onSyncTeams(selectPlayer)
	{
		MyTrello.get_cards(MyTrello.current_game_list_id, function(data){

			response = JSON.parse(data.responseText);
			response.forEach(function(obj){
				name = obj["name"];
				code = obj["id"];

				// Add to teams array
				if(!teams_added.includes(name))
				{
					teams_added.push(name);
					onAddTeam(code, name);
				}

				document.getElementById("team-sync").style.display = "inline";
				setTimeout(function(){
					document.getElementById("team-sync").style.display = "none";
				}, 1000);

			});

			// Selects a random player once players have been loaded;
			if(selectPlayer){ onUpdateTurn(true); }
		});
	}

	// Adds a team Row to the teams table
	function onAddTeam(teamCode, teamName){

		let content = `
			<tr class=\"team_row\">
				<td class=\"team_name_cell\">
					<h2>
						<span contenteditable=\"true\" data-jpd-team-code=\"${teamCode}\" class=\"team_name\">${teamName}</span>
					</h2>
				</td>
				<td>
					<h2><span data-jpd-team-code=\"${teamCode}\" class=\"team_score\">000</span></h2>
				</td>
				<td class=\"wager_row\">
					<h2><span data-jpd-team-code=\"${teamCode}\" class=\"team_wager hidden\">000</span></h2>
				</td>
			</tr>
		`;

		document.getElementById("teams_block2").innerHTML += content;
	}

	

/********************************************************************************
	Create/Update DOM
*********************************************************************************/

	function create_game_board()
	{
		Logger.log("Creating the Game Board.");

		// Two "boards" - regular round and final jeopardy
		var main_board = "<tr id=\"round_1_row\" class=\"hidden\">";
		var final_board = "<tr id=\"final_jeopardy_row\" class=\"hidden\">";

		// Get categories;
		let categories = JeopardyGame.getCategories();
		let categoriesLength = categories.length-1;

		categories.forEach(function(category){

			isFinalJeopardy = category.isFinalJeopardy();

			// if(!isFinalJeopardy)
			// {
			// Properties for the table rows
			colspan 		= (isFinalJeopardy) ? 3 : 1;
			dynamic_width 	= (isFinalJeopardy) ? 100 : (1 / categoriesLength);

			category_name 	= category.getName();

			// Set the header for the category
			category_name_row 		= `<tr><th class='category category_title' data-jpd-category-name=\"${category_name}\"></th></tr>`;
			
			// Set the questions 
			category_questions_row	= "";
			questions = category.getQuestions();
			questions.forEach(function(question){
				

				quest = question.getQuestion();
				ans   = question.getAnswer();
				key = (isFinalJeopardy) ? category_name : (category_name + " - " + quest["value"]);

				QA_MAP[key] = {
					"question": quest,
					"answer"  : ans
				}
				
				category_questions_row += `<tr><td class='category category_option' data-jpd-quest-key=\"${key}\">${quest["value"]}</tr></td>`;
			});
			
			// The column
			let column = `<td colspan=\"colspan\" style='width:${dynamic_width}%;'><table class='category_column'>${category_name_row} ${category_questions_row}</table></td>`;

			if(isFinalJeopardy)
			{
				final_board += column;
			}
			else
			{
				// Add column for category to Game Board
				main_board += column;
			}
				
			// }
		});

		// Close both rows;
		main_board += "</tr>";
		final_board += "</tr>";

		// game_board += "</tr><tr id=\"final_jeopardy_row\" class=\"hidden\">";

		let game_board = main_board + final_board;

		document.getElementById("game_board_body").innerHTML = game_board;
	}	

/********************************************************************************
	HELPER FUNCTIONS
*********************************************************************************/

	function isFinalJeopardy2()
	{
		let row = document.getElementById("final_jeopardy_row");
		let visible = !row.classList.contains("hidden");
		return visible;
	}

	function getMaxPossibleWager()
	{
		let max = 0;

		let team_score_values = document.querySelectorAll("span.team_score");
		for(var idx = 0; idx < team_score_values.length; idx++)
		{
			let val = Number(team_score_values[idx].innerText);
			if (!isNaN(val) && val > max)
			{
				max = val;
			}
		}

		return max;
	}

	/* Purpose: Returns a random character from the alphabet; Used to generate team codes */
	function getRandomCharacter()
	{
		characters = "abcdefghijklmnopqrstuvwxyz";
		randChar = Math.floor(Math.random()*characters.length);
		return characters[randChar].toUpperCase();
	}

	/* Purpose: Generates 4 random characters to create a team code; */
	function getGameCode()
	{
		let char1 = getRandomCharacter();
		let char2 = getRandomCharacter();
		let char3 = getRandomCharacter();
		let char4 = getRandomCharacter();

		let chars = char1 + char2 + char3 + char4;

		// Make sure the code is not demo;
		let game_code = (chars == "DEMO") ? getGameCode() : chars;

		return game_code
	}

 /* CREATE / SET */ 
	function setWager(teamCode, content="0")
	{
		let max = getMaxPossibleWager();
		let teamWager = document.querySelector("span.team_wager[data-jpd-team-code='"+teamCode+"'"); // only used in final jeopardy
		teamWager.classList.remove("hidden");
		let wager_value = 0;

		MyTrello.get_card_actions(teamCode, function(data){
			response = JSON.parse(data.responseText);

			if (response.length > 0)
			{
				sorted = response.sort(function(a, b){
					d1 = new Date(a["date"])
					d2 = new Date(b["date"])
					return d1 < d2
				});

				latest_comment = sorted[0];

				wager_value = latest_comment.data.text;

				let conversion = Number(wager_value);
				let number = isNaN(conversion) ? "0" : conversion;

				answer = number;
				if (number > max)
				{
					answer = max;
				}

				teamWager.innerText = answer;
			}
		});
	}

 /* LOAD / GET */
	function getCheckBox(teamName, teamCode)
	{
		label = "<td><label>" + teamName + "</label><span>&nbsp;</span></td>";
		answer = "<td><p class=\"team_answer\" data-jpd-team-code=\"" + teamCode + "\"></p></td>";
		input = "<td><input type=\"checkbox\" data-jpd-team-code=\"" + teamCode + "\" class=\"correct_team\" name=\"" + teamCode + "\"></td>";
		return "<tr>" + label + answer + input + "</tr>";
	}

	function loadTeamNamesInCorrectAnswerBlock()
	{
		// Load the teams into the popup; To be used to determine who got it right;
		document.getElementById("team_list").innerHTML = "";
		teams = document.querySelectorAll(".team_name");
		teams.forEach(function(obj){
			name = obj.innerHTML;
			code = obj.getAttribute("data-jpd-team-code");
			inp = getCheckBox(name, code);
			document.getElementById("team_list").innerHTML += inp;
		});
	}

	function getDailyDoubleContent()
	{
		Logger.log("Getting Daily Double Content");
		let content = "";
		content += formatAudio("../assets/audio/daily_double.m4a", true);
		content += formatImages("../assets/img/daily_double.jpeg");
		return content;
	}

	function loadQuestion(cell)
	{
		Timer.resetTimer();

		Logger.log("Loading Question");
		Logger.log(cell);

		// Load Teams into Correct Answer Block
		loadTeamNamesInCorrectAnswerBlock();

		// Set the selected cell to disabled;
		cell.style.backgroundColor = "gray";
		cell.style.color = "black";
		cell.disabled = true;
		
		document.getElementById("question_view").classList.remove("hidden");

		let key = cell.getAttribute("data-jpd-quest-key");

		let map = QA_MAP[key];

		let question = formatContent(map["question"]);
		let answer   = formatContent(map["answer"]);
		let value    = Number(map["question"]["value"]);
		let isDailyDouble = map["question"]["dailydouble"];

		if(isDailyDouble)
		{
			question = getDailyDoubleContent() + question;
		}

		let question_block = document.getElementById("question_block");
		let answer_block   = document.getElementById("answer_block");
		let value_block    = document.getElementById("value_block");

		// console.log(formatContent(question));
		question_block.innerHTML = question;
		answer_block.innerHTML = answer;
		value_block.innerHTML = (isDailyDouble) ? 2 * value : isFinalJeopardy2() ? getMaxPossibleWager() : isNaN(value) ? "n/a" : value;
	}

 /* FORMATTING CONTENT */

	function formatContent(obj)
	{
		Logger.log("Formatting content")

		let content = "";

		console.log(obj);

		// Format the Image
		if(obj.hasOwnProperty("image"))
		{
			content += formatImages(obj["image"])
		}

		// Format the Audio
		if(obj.hasOwnProperty("audio"))
		{
			content += formatAudio(obj["audio"]);
		}

		// Format the Text
		if(obj.hasOwnProperty("text"))
		{
			content += formatText(obj["text"]);
		}

		// Format the URLs
		if(obj.hasOwnProperty("url"))
		{
			content += formatHyperlink(obj["url"])
		}

		return content;
	}

	function formatText(value)
	{
		formatted = value.replaceAll("\\n", "<br/>");
		return `<span>${formatted}</span>`
	}

	function formatImages(value)
	{
		Logger.log("Image value: " + value);

		formatted = "";
		if (value != "")
		{
			formatted = `<img src=\"${value}\" alt_text='Image'/><br/><br/>`;
		}
		return formatted;
	}

	function formatAudio(value, isAutoPlay=false)
	{
		Logger.log("Audio value: " + value);

		formatted = "";
		if (value != "")
		{
			let autoplay = (isAutoPlay) ? " autoplay" : "";
			let controls = (isAutoPlay) ? "" : " controls";
			let audio_open = "<audio " + controls + autoplay + ">";
			let audio_source  = `<source src=\"${value}\" type='audio/mpeg'/>`;
			let audio_close = "</audio><br/><br/>";
			formatted = audio_open + audio_source + audio_close;
		}
		return formatted;
	}

	function formatHyperlink(value)
	{
		Logger.log("Hyperlink value: " + value);
		formatted = "";
		if(value != "")
		{
			formatted = `<br/><a class='answer_link' href=\"${value}\" target='_blank'>${value}</a>`;
		}
		return formatted;
	}

 /* UPDATING GAME THINGS */
	function updateScore()
	{
		var correct = document.querySelectorAll(".correct_team"); // Get the list of teams that got it correct
		var question_value = document.getElementById("value_block").innerText; // Get the value of the question

		var isFinalUpdate = isFinalJeopardy2();

		for(var idx = 0; idx < correct.length; idx++)
		{
			let ele = correct[idx];
			let teamCode = ele.getAttribute("data-jpd-team-code");

			let team_score_value = document.querySelector("span.team_score[data-jpd-team-code='"+teamCode+"'");
			let team_score = Number(team_score_value.innerText);

			let team_wager_value = document.querySelector("span.team_wager[data-jpd-team-code='"+teamCode+"'"); // only used in final jeopardy
			let team_wager = Number(team_wager_value.innerText);

			let points = (isFinalUpdate) ? team_wager : Number(question_value);

			if (ele.checked)
			{
				let new_score = team_score + points;
				team_score_value.innerText = new_score;
			} 
			else if (isFinalUpdate && !ele.checked)
			{
				let new_score = team_score - points;
				team_score_value.innerText = new_score;
			}
		}
		// updateLeader();
		updateLeader();
	}

	function updateLeader()
	{

		table_body = document.getElementById("teams_block2");

		current_teams = Array.from(document.getElementsByClassName("team_row"));
		sorted_teams = current_teams.sort(function(a,b){
							a_score = a.getElementsByClassName("team_score")[0].innerText;
    						b_score = b.getElementsByClassName("team_score")[0].innerText;
    						return b_score - a_score;
						});

		sorted_teams_html = "";
		table_body.innerHTML = "";

		//  Update the table with the correct order
		sorted_teams.forEach(function(row){ 
			table_body.innerHTML += row.outerHTML;
		});

		updateLeaderColors()
	}


	function updateLeaderColors()
	{
		var team_scores = document.querySelectorAll("span.team_score");
		var scores = [];
		for (var i = 0; i < team_scores.length; i++)
		{
			let sect = team_scores[i];
			let score = Number(sect.innerHTML);
			if (!scores.includes(score))
			{
				scores.push(score);
			}
		}
		// Sort the scores
		scores = scores.sort(function(a,b){return b-a; });
		let length = scores.length;

		// Set the first, second, and third values; 
		let first = scores[0];
		let second = (scores.length > 1) ? scores[1] : -1;
		let third = (scores.length > 2 ) ? scores[2] : -1;

		for (var i = 0; i < team_scores.length; i++)
		{
			let sect = team_scores[i];
			sect.classList.remove("first_place");
			sect.classList.remove("second_place");
			sect.classList.remove("third_place");
			let val = Number(sect.innerHTML);
			if (val == first){ sect.classList.add("first_place"); }
			else if (val == second){ sect.classList.add("second_place"); }
			else if (val == third){ sect.classList.add("third_place"); }
		}
	}

 /* STOP / RESET */

	function resetAnswers()
	{
		Logger.log("Clearing Answers!");
		let teams = Array.from(document.querySelectorAll(".team_name"));
		teams.forEach(function(obj){
			card_id = obj.getAttribute("data-jpd-team-code");
			MyTrello.update_card(card_id, "");
		});
	}

 // Speech
	function speakText(message)
	{
		let synth = window.speechSynthesis;

		// https://dev.to/asaoluelijah/text-to-speech-in-3-lines-of-javascript-b8h
		var msg = new SpeechSynthesisUtterance();
		msg.text = message;
		synth.speak(msg);
	}

