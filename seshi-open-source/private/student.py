'''
Created on Dec 15, 2016
'''

import json

class student:
    '''
    classdocs
    '''
    name = "default_name";
    student_schedule = [];
    gender = 0;
    leadership = 0;
    number=0;
    #teamsWithMaxScore = None;

    def getTeams(self):
        return self.teams;

    def reduceNumByOne(self):
        self.number -= 1;

    def updateTeams(self,team_input):

        new_teams = [];

        #previous for loop
        if self.debug:
            for team in self.teams:
                print team;
            print "\n";

        #processing for loop
        for i in range(0,len(self.teams)):

            team = self.teams[i];
            #DEBUG
            if self.debug:
                print "dup DEBUG:";
                print team;
                print "and"
                print team_input;
                print"\n";
            if not team_input.dup(team):
                if self.debug:
                    print "No Duplicate!!!\n"
                new_teams.append(team);
            else:
                self.reduceNumByOne();

        self.teams = new_teams;


        #after processing loop
        if self.debug:
            for team in self.teams:
                print team;
            print "\n";


    def setNum(self, num):
        self.number = num;

        if self.debug:
            print "The num set is: "+str(self.number);

    def getMaxTeam(self):
        maxTeam = self.teams[0];

        for team in self.teams:
            if (team.getScore() > maxTeam.getScore()):
                maxTeam = team;
        return maxTeam;

    def getNum(self):
        return self.number;

    def __init__(self, name,gender,leadership,debug):
        '''
        Constructor
        '''
        self.teams = [];

        self.name = name;
        self.gender = gender;
        self.leadership = leadership;
        self.debug = debug;


    def __str__(self):
        return self.name;

    def __repr__(self):
        return str(self.__dict__);

    def toJSON(self):
		return json.dumps(self, default=lambda o: o.__dict__,sort_keys=True)

# StudentA =student("A","Male","Balanced",0)
# StudentA.student_schedule=["1","2","3"]
# StudentB =student("B","Female","Balanced",0)
# StudentB.student_schedule=["1","2","3"]
# StudentC =student("C","Male","Balanced",0)
# StudentC.student_schedule=["1","2","3"]
# StudentD =student("D","Male","Pref Leading",0)
# StudentD.student_schedule=["1","2","3"]
# team1=[]
# team1.append(StudentA)
# team1.append(StudentB)
# team1.append(StudentC)
# team1.append(StudentD)
# StudentE =student("E","Male","Balanced",0)
# StudentE.student_schedule=["04","5","06"]
# StudentF =student("F","Male","Balanced",0)
# StudentF.student_schedule=["14","5","16"]
# StudentG =student("G","Male","Balanced",0)
# StudentG.student_schedule=["24","5","26"]
# StudentH =student("H","Male","Balanced",0)
# StudentH.student_schedule=["34","5","36"]
# team2=[]
# team2.append(StudentE)
# team2.append(StudentF)
# team2.append(StudentG)
# team2.append(StudentH)
# Team1=team(team1,1)
# Team2=team(team2,1)
# print Team1.cslot
# print Team2.cslot
# print Team1.getleadershipsum()
# print Team1.getgendersum()
