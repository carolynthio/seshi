from student import student
from team import team

import sys
import json
from collections import namedtuple
import ast

# returns the team the student is currently in
def currentTeam(student, finalTeams):
    for team in finalTeams:
        for eachStudent in team.member:
            if student.__dict__ == eachStudent.__dict__:
                return team

#swapping based on score
def suggestSwaps_bos(studentToSwap,allformedteams):
    suggestedTeam_suggest=[]
    maxSuggestions = 3
    notInTeam = True
    for team in allformedteams:
        for eachStudent in team.member:
            if eachStudent.__dict__ == studentToSwap.__dict__:
                notInTeam = False
        if notInTeam:
        # if studentToSwap not in team.member:
            temp_list=temporaryswapandgetscore(studentToSwap, team,allformedteams)
            for element in temp_list:
                suggestedTeam_suggest.append(element)
        notInTeam = True


    sorted_team = sorted(suggestedTeam_suggest, key=lambda tup: tup[1], reverse=True)
    sorted_team=sorted_team[0:maxSuggestions]

    result = ""
    for item in sorted_team:
        # print item[0]
        result += str(item[0]) + " & "
        # print item[1]
        result += str(item[1]) + " $ "
    return sorted_team
    # return result

# Finds the score of prospective teams to swap
def temporaryswapandgetscore(studentA, Teamtoswap,finalteams):

    scoreindexlist=[]
    currentteam=currentTeam(studentA, finalteams)
    for student in Teamtoswap.member:
        indexA = Teamtoswap.member.index(student)
        for m in currentteam.member:
            if m.__dict__ == studentA.__dict__:
                indexB = currentteam.member.index(m)
        studentB=Teamtoswap.member[indexA]
        studentC=currentteam.member[indexB]
        Teamtoswap.member[indexA] = studentA
        currentteam.member[indexB] = student
        scoreindexlist.append((student,(Teamtoswap.calScore()+currentteam.calScore())/2))
        Teamtoswap.member[indexA] = studentB
        currentteam.member[indexB] = studentC

    sorted_scoreindexlist = sorted(scoreindexlist, key=lambda tup: tup[1], reverse=True)
#     print sorted_scoreindexlist
    return sorted_scoreindexlist


def swapStudents(studentA, studentB, finalTeams):
    currentTeamA = currentTeam(studentA, finalTeams)
    currentTeamAScore = currentTeamA.score
    currentTeamB = currentTeam(studentB, finalTeams)
    currentTeamBScore = currentTeamB.score

    print currentTeamA.member
    print currentTeamB.member

    print "OLD SCORES: ", currentTeamAScore, currentTeamBScore
    # Get index of each team
    indexA = currentTeamA.member.index(studentA)
    indexB = currentTeamB.member.index(studentB)

    #Swap students
    currentTeamA.member[indexA] = studentB
    currentTeamB.member[indexB] = studentA

    print currentTeamA.member
    print currentTeamB.member

    print "NEW SCORES"

    print currentTeamA.calScore()
    print currentTeamB.calScore()


# print "Swapping Student based on team score"
studentToSwap = student(sys.argv[1],float(sys.argv[2]),float(sys.argv[3]),False)
studentToSwap.student_schedule = sys.argv[4].split(',')
studentToSwap.student_schedule = map(int, studentToSwap.student_schedule)

final_teams_args = sys.argv[5].split(' $ ')

constraintsList = []
weightList = []
if(sys.argv[6]):
	constraintsListArg = ast.literal_eval(sys.argv[6])
	for constraint in constraintsListArg:
		if constraint[0] == "availability":
			constraintsList.append("schedule");
			weightList.append(float(constraint[2])/100)
			team.min_common_time = int(constraint[1])
		else:
			if constraint[1] == "true":
				if constraint[0] == "studentLikes":
					studentLikesPreferences = True
				elif constraint[0] == "studentDislikes":
					studentDislikesPreferences = True
				else:
					if constraint[0] == "genderbalance":
						constraintsList.append("gender")
						weightList.append(float(constraint[2])/100)
					else:
						constraintsList.append(constraint[0])
						weightList.append(float(constraint[2])/100)
# print sys.argv[1]
# print sys.argv[2]
# print sys.argv[3]
# print sys.argv[4]
# print sys.argv[5]

final_teams_objs = []
for i in range(0,len(final_teams_args)-1):
    # obj = json.loads(final_teams_args[i], object_hook=lambda d: namedtuple('X', d.keys())(*d.values()))
    obj = json.loads(final_teams_args[i])
    members = []
    for m in obj["member"]:
        #name,gender,leadership
        tempStudent = student(m["name"], m["gender"],m["leadership"], m["debug"])
        tempStudent.student_schedule = m["student_schedule"]
        members.append(tempStudent)
    tempTeam = team(members, weightList, constraintsList, obj["class_avg_leadership"], obj["class_avg_gender"] );
    tempTeam.score = obj["score"]
    tempTeam.overlappingSchedule = obj["overlappingSchedule"]
    if members:
        final_teams_objs.append(tempTeam)
# print final_teams_objs
# sys.stdout.flush()

suggestedSwaps = suggestSwaps_bos(studentToSwap, final_teams_objs)
result = ""
for each in suggestedSwaps:
    result += each[0].toJSON() + " & "
    result += str(each[1]) + " $ "
print result
sys.stdout.flush()

# studentsuggested=suggestedSwaps[0][0]
# print studentsuggested
# swapStudents(studentToSwap, studentsuggested, final_teams)
# print("--- %s seconds --- for swapping a student" % (time.time() - start_time))
