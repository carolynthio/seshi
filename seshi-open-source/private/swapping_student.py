from student import student
from team import team

# returns the team the student is currently in
def currentTeam(student, finalTeams):
    for team in finalTeams:
        for eachStudent in team.member:
            if student == eachStudent:
                return team

#swapping based on score
def suggestSwaps_bos(studentToSwap,allformedteams):
    suggestedTeam_suggest=[]
    maxSuggestions = 3
    for team in allformedteams:
        if studentToSwap not in team.member:
            temp_list=temporaryswapandgetscore(studentToSwap, team,allformedteams)
            for element in temp_list:
                suggestedTeam_suggest.append(element)


    sorted_team = sorted(suggestedTeam_suggest, key=lambda tup: tup[1], reverse=True)
    sorted_team=sorted_team[0:maxSuggestions]
    for item in sorted_team:
        print item[0]
        print item[1]
    return sorted_team

# Finds the score of prospective teams to swap
def temporaryswapandgetscore(studentA, Teamtoswap,finalteams):

    scoreindexlist=[]
    currentteam=currentTeam(studentA, finalteams)
    for student in Teamtoswap.member:
        indexA = Teamtoswap.member.index(student)
        indexB = currentteam.member.index(studentA)
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
