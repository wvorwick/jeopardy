
/***** 
SETTINGS  OBJECT 
This object stores the setting and rule configuration for the game
******/

const Settings = {

	currentSettings : [
		{ "name": "Answering Questions", "value": "Everybody Gets a Chance"},
		{ "name": "Selecting Questions", "value": "Everybody Gets a Chance"},
		{ "name": "Time to Answer Questions", "value": "15"},
		{ "name": "Final Jeopardy Wager", "value":"Max Wager is Highest Score"}
	],

	currentRules: [],

	GetSettings: function(jsonObj=undefined){
		this.currentSettings = (jsonObj != undefined) ? jsonObj : this.currentSettings;
		return this.currentSettings;
	},

	GetRules: function(){

		this.currentSettings.forEach(function(obj){
			name = obj["name"];
			type = Settings.GetSettingType(name);
			value = obj["value"];

			rule = Rules.getRule(type, name, value);

			if(rule!= undefined)
			{
				Settings.currentRules.push(rule);
			}
		});
		console.log(this.currentRules);
		return this.currentRules;
	},

	GetSettingType: function(name){
		let type = "";
		this.settingOptions.forEach(function(obj){
			if(obj["name"].toLowerCase() == name.toLowerCase()){
				type = obj["type"];
			}
		});	
		return type;
	},

	settingOptions: [
			{
				"name": "Answering Questions",
				"type": "select",
				"builtin": true,
				"options":["Everybody Gets a Chance", "First to Buzz-in"]
			},
			{
				"name": "Selecting Questions",
				"type": "select",
				"builtin": true,
				"options":["Everybody Gets a Chance", "Who Gets it Right"]
			},
			{
				"name": "Time to Answer Questions",
				"type": "number",
				"builtin": false,
				"options":[]
			},
			{
				"name": "Final Jeopardy Wager",
				"type": "select",
				"builtin": true,
				"options":["Max Wager is Highest Score"]
			},
	]
}



const Rules = {

	getRule: function(type, name, value){

		let ruleObj = undefined;
		switch(type)
		{
			case "number":
				if(this._ruleExists(name))
				{
					ruleObj = this.ruleSet[name];
					ruleObj["rule"] = ruleObj["rule"].replace("${VALUE}",value);
				}
				break;
			case "select":
				if(this._ruleExists(name, value))
				{
					ruleObj = this.ruleSet[name][value];
				}
				break;
			default:
				break;
		}
		return ruleObj;
	},

	_ruleExists: function(name, value=undefined){
		try
		{

			isValid = false;
			if(value == undefined)
			{
				return this.ruleSet.hasOwnProperty(name);
			}
			else if (value != undefined)
			{
				return (this.ruleSet.hasOwnProperty(name) && this.ruleSet[name].hasOwnProperty(value))
			}
		}
		catch(error)
		{
			Logger.log(error);
			return false;
		}
	},


	ruleSet: {

		"Answering Questions": {
			"Everybody Gets a Chance": {
				"rule":"Everyone gets a chance to answer every question!",
				"subRules":["For each question, every team gets a chance to answer.",
							"Including the \"Daily Double\" questions"
							]
			},
			"First to Buzz-in": {
				"rule":"The first person to buzz in after the question is asked, gets to answer the question first.",
				"subRules":["If the person who buzzes doesn't get it correct, the next person to buzz in gets to answer",
							"NOTE: The game doesn't have any buzz-in feature, so you'll have to use your own buzzers"
							]
			},
		},

		"Selecting Questions": {
			"Everybody Gets a Chance": {
				"rule":"Everyone gets a chance to pick a question from the board.",
				"subRules":["The game will automatically cycle through the list of teams"]
			},
			"Who Gets it Right": {
				"rule":"The first person to buzz-in AND get the question correct gets to pick the next question",
				"subRules":[]
			},
		},

		"Time to Answer Questions": {
			"rule":"You've got ${VALUE} seconds to answer the question!",
			"subRules":["That's how long you get to deliberate for each question.",
					"Time starts after the question is read"
					]
		},

		"Final Jeopardy Wager" : {
			"Max Wager is Highest Score" : {
				"rule":"For FINAL JEOPARDY, you can wager as much as the HIGHEST OVERALL SCORE!",
				"subRules":["The max amount that you can wager is based on the highest overall score!",
							"So, you could come from behind &amp; beat the team in the lead &#128578;",
							"Or, you could lose it all and end up with negative points. &#128579;"
							]
			}
		}
	}

}