import csv
import heapq
from student import student
from team import team
from team import calSchedule
from team import overlap
import sys
import time
import numpy as np
import operator

import sys
import json
import ast

start_time = time.time()

###############################
##### define helper flags #####
###############################
unit_test = False;
debug = False;

studentLikesPreferences = False
studentDislikesPreferences = False
########################################
##### import students from file ########
########################################

# Generates all combinations of student teams
def genAllCombination(all_students,combinations, curr_team_list, number_students_needed, team_num,index, studentLikeDict):
    # if calSchedule(curr_team_list) < mini_common_time_slots:
    #     return team_num;
    if studentLikesPreferences == True:
        # if return true means we want to delete this team for list of all combinations
        if (del_comb_without_pref_like(curr_team_list, studentLikeDict)):
            return team_num;

    if studentDislikesPreferences == True:
        if (isviolatedislikes(curr_team_list)):
            return team_num

    if number_students_needed == 0:
        if debug:
            print team_num;

        team_num = team_num + 1;
        newlist = [item for item in curr_team_list];
        combinations.append(newlist);
        return team_num;

    for i in range(index,len(students)):
        s = students[i];
        if s not in curr_team_list:
            curr_team_list.append(s);
            team_num = genAllCombination(all_students,combinations,curr_team_list,number_students_needed-1,team_num,i+1, studentLikeDict);
            curr_team_list.remove(s);

    return team_num;

'''
    make each combination a team;
'''
def byScore_key(team):
    return -team.getScore();

def changeToSortedTeams(combinations,weights, constraintsList, class_avg_leadership, class_avg_gender):
    teams = [];
    for combination in combinations:
        teams.append(team(combination,weights, constraintsList, class_avg_leadership, class_avg_gender));
    return sorted(teams, key = byScore_key);


def selectTeams(all_possible_teams):
    #define the final result teams:
    res_teams = [];

    #initialize the map to calculate the number
    #of teams for each student
    while not (len(all_possible_teams) is 0):

        # print "Runnning - "
        #record the num of teams for students
        stu_num = {};
        for student in students:
            stu_num[student] = 0;

        #calculate the number of teams for each student
        for team in all_possible_teams:
            for stu in team.getMembers():
                stu_num[stu] += 1;

        # seeing which students dont have any teams
        # print "TESTING SELECT TEAMSSS"
        # for student in students:
        #     if (stu_num[student] == 0):
        #         print student.name

        #find the student with minimum number of teams
        min_num = sys.maxint;
        min_stu = students[0];

        for stu in stu_num:
            if (stu_num[stu] < min_num and stu_num[stu] > 0): # making we dont select
                                                              # students with no possible teams
                min_num = stu_num[stu];
                min_stu = stu;

        #find the team with max score
        #since all the teams are sorted by score,
        #so choose the first one with max_stu
        selected_team = all_possible_teams[0];
        for team in all_possible_teams:
            if min_stu in team.getMembers():
                res_teams.append(team);
                selected_team = team;
                break;

        #delete all students from the selected teams
        for stu in selected_team.getMembers():
            students.remove(stu);

        ##update all the teams that contain
        #the student in the selected team
        team_temp = [];
        for team in  all_possible_teams:
            if not team.hasDupMember(selected_team):
                team_temp.append(team);
        all_possible_teams = team_temp;

    return res_teams;

# def del_comb_without_pref_like(allcombinationofteams,listofdict_do):
#     listofdict_do={k.lower(): [i.lower() for i in v] for k, v in listofdict_do.items()}
#     for key,value in listofdict_do.iteritems():
#         valuetodelete=[]
#         for element in value:
#             if (element in listofdict_do):
#                 if not (key in listofdict_do[element]):
#                     valuetodelete.append(element)
#             else:
#                 valuetodelete.append(element)
#         for element in valuetodelete:
#             value.remove(element)
#
#     listofdict_do = {key: value for key, value in listofdict_do.items() if len(value) is not 0}
#
#     indexlist=[]
#     for team in allcombinationofteams:
#         namelist=[]
#         for student in team:
#             namelist.append(student.name.lower())
#         for key, value in listofdict_do.iteritems():
#             temp_set=set(value)
#             temp_set=temp_set.union(set([key]))
#             if key in namelist:
#                 if not ((temp_set & set(namelist))==temp_set):
#                     indexlist.append(allcombinationofteams.index(team))
#     indexlist=list(set(indexlist))
#     allcombinationofteams = [i for j, i in enumerate(allcombinationofteams) if j not in indexlist]
#     return allcombinationofteams
def del_comb_without_pref_like(team,listofdict_likes):
    listofdict_do={k.lower(): [i.lower() for i in v] for k, v in listofdict_likes.items()}
    for key,value in listofdict_do.iteritems():
        valuetodelete=[]
        for element in value:
            if (element in listofdict_do):
                if not (key in listofdict_do[element]):
                    valuetodelete.append(element)
            else:
                valuetodelete.append(element)
        for element in valuetodelete:
            value.remove(element)

    listofdict_do = {key: value for key, value in listofdict_do.items() if len(value) is not 0}
    # indexlist=[]
    # for team in allcombinationofteams:
    namelist=[]
    for student in team:
        namelist.append(student.name.lower())
    for key, value in listofdict_do.iteritems():
        temp_set=set(value)
        temp_set=temp_set.union(set([key]))
        if key in namelist:
            if not ((temp_set & set(namelist))==temp_set):
                return True #bad team
    return False
    #             indexlist.append(allcombinationofteams.index(team))
    #
    # indexlist=list(set(indexlist))
    # allcombinationofteams = [i for j, i in enumerate(allcombinationofteams) if j not in indexlist]
    # return allcombinationofteams

# def del_comb_without_pref_dislike(allcombinationofteams,listofdict_not):
#     listofdict_not={k.lower(): [i.lower() for i in v] for k, v in listofdict_not.items()}
#     indexlist=[]
#     for team in allcombinationofteams:
#         namelist=[]
#         for student in team:
#             namelist.append(student.name.lower())
#         for key, value in listofdict_not.iteritems():
#             temp_set=set(value)
#             temp_set=temp_set.union(set([key]))
#             if key in namelist:
#                 if ((temp_set & set(namelist))==temp_set):
#                     indexlist.append(allcombinationofteams.index(team))
#     indexlist=list(set(indexlist))
#     allcombinationofteams = [i for j, i in enumerate(allcombinationofteams) if j not in indexlist]
#     return allcombinationofteams


def isviolatedislikes(curr_team_list):
    namelist=[]
    for student in curr_team_list:
#             print student.name.lower()
        namelist.append(student.name.lower())
#     print namelist
    for student in curr_team_list:
        hatepairs=[]
        for element in student.dislikes:
            elementl=element.lower()
            hatepairs.append(set([elementl]).union(set([student.name.lower()])))
        for pair in hatepairs:
            if ((pair & set(namelist))==pair):
                return True

    return False
'''
    Main Function
'''

''' Set the parameters here '''
mini_common_time_slots = 0;
number_student_per_team_lo = int(sys.argv[1]);
number_student_per_team_hi = int(sys.argv[2]);

# filename = "assets/app/Dataset1.csv"; # TODO: Will need to change to read from file input
# filename = "Dataset1.csv";
students = [];
weight1 = 1;

''' import student from the file '''

# with open (filename,'rU') as data_file:
#     student_data = csv.reader(data_file);
#     next(student_data, None); # skip the header
#     for row in student_data:
#         temp = student(row[0],float(row[1]),float(row[2]),debug);
#         temp_list = row[3:];
#         temp_list = map(int,temp_list);
#         temp_schedule = temp_list;
#         students.append(temp);
#         temp.student_schedule = temp_schedule;

studentList = ast.literal_eval(sys.argv[3])
for s in studentList:
    temp = student(s['name'], float(s['gender']), float(s['leadership']), debug)
    temp_schedule = [s['sun8a'],s['sun9a'],s['sun10a'],s['sun11a'],s['sun12p'],s['sun1p'],s['sun2p'],s['sun3p'],s['sun4p'],s['sun5p'],s['sun6p'],s['sun7p'],s['sun8p'], \
                s['mon8a'],s['mon9a'],s['mon10a'],s['mon11a'],s['mon12p'],s['mon1p'],s['mon2p'],s['mon3p'],s['mon4p'],s['mon5p'],s['mon6p'],s['mon7p'],s['mon8p'], \
                s['tues8a'],s['tues9a'],s['tues10a'],s['tues11a'],s['tues12p'],s['tues1p'],s['tues2p'],s['tues3p'],s['tues4p'],s['tues5p'],s['tues6p'],s['tues7p'],s['tues8p'], \
                s['wed8a'],s['wed9a'],s['wed10a'],s['wed11a'],s['wed12p'],s['wed1p'],s['wed2p'],s['wed3p'],s['wed4p'],s['wed5p'],s['wed6p'],s['wed7p'],s['wed8p'], \
                s['thur8a'],s['thur9a'],s['thur10a'],s['thur11a'],s['thur12p'],s['thur1p'],s['thur2p'],s['thur3p'],s['thur4p'],s['thur5p'],s['thur6p'],s['thur7p'],s['thur8p'], \
                s['fri8a'],s['fri9a'],s['fri10a'],s['fri11a'],s['fri12p'],s['fri1p'],s['fri2p'],s['fri3p'],s['fri4p'],s['fri5p'],s['fri6p'],s['fri7p'],s['fri8p'], \
                s['sat8a'],s['sat9a'],s['sat10a'],s['sat11a'],s['sat12p'],s['sat1p'],s['sat2p'],s['sat3p'],s['sat4p'],s['sat5p'],s['sat6p'],s['sat7p'],s['sat8p']]
    temp_schedule = map(int,temp_schedule)
    students.append(temp)
    temp.student_schedule = temp_schedule
    temp.role = s['roleDistribution'].split(", ")
    if ('studentLikes' in s):
        temp.likes.append(s['studentLikes'].strip())
    if ('studentDislikes' in s):
        arrayDislikes = s['studentDislikes'].split(", ")
        for dislike in arrayDislikes:
            temp.dislikes.append(dislike.strip())
studentRoster = students;
studentToSwap = students[0]
gender = [s.gender for s in students]
class_avg_gender = sum(gender) / len(gender)
leadership = [s.leadership for s in students]
class_avg_leadership = sum(leadership) / len(leadership)
# constraintsList = ["schedule"];
constraintsList = []
weightList = []
if(sys.argv[4]):
    constraintsListArg = ast.literal_eval(sys.argv[4])
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

if debug:
    print "Here are all the students: "
    for curr in students:
        print(curr);
        #print sum(curr.student_schedule);

# print("--- %s seconds --- for parsing csv" % (time.time() - start_time))

''' Find all the combinations '''
studentLikesDict = {}
if studentLikesPreferences == True:
    studentLikesDict = {}
    for student in students:
        # if list is not empty
        if (student.likes):
            for like in student.likes:
                if student.name in studentLikesDict:
                    studentLikesDict[student.name].append(like)
                else:
                    studentLikesDict[student.name] = [like]

    # combinations = del_comb_without_pref_like(combinations,studentLikesDict)

# studentDislikesDict = {}
# if studentDislikesPreferences == True:
#     studentDislikesDict = {}
#     for student in students:
#         # if list is not empty
#         if (student.dislikes):
#             for dislike in student.dislikes:
#                 if student.name in studentDislikesDict:
#                     studentDislikesDict[student.name].append(dislike)
#                 else:
#                     studentDislikesDict[student.name] = [dislike]

    # combinations = del_comb_without_pref_dislike(combinations,studentDislikesDict)
combinations = [];
for i in range(number_student_per_team_lo,number_student_per_team_hi+1):
    genAllCombination(students,combinations,[],i,0,0, studentLikesDict);
# print("--- %s seconds --- for generating all combinations" % (time.time() - start_time))


''' Change the combinations to be teams(team object) '''
# TODO: This is where we would filter out student preferences for partners
# Check something like if (pref.length != 0) or if prefNot.length != 0)
all_possible_sorted_teams = changeToSortedTeams(combinations,weightList, constraintsList, class_avg_leadership, class_avg_gender);
# print "All possible sorted teams length: ", len(all_possible_sorted_teams)
# for team in all_possible_sorted_teams:
#     print str(team);
# print("--- %s seconds --- for change all combinations to teams" % (time.time() - start_time))

''' Select a set of feasible teams from the team object '''
final_teams = selectTeams(all_possible_sorted_teams);
# print "selected teams length: ", len(final_teams)
# print("--- %s seconds --- for selecting all the teams" % (time.time() - start_time))
# for team in final_teams:
#     print "printing final teams"
#     print str(team);

# if len(students) is 0:
#     print "All students have been selected!"
# else:
#     print "The non-selected students are: "
#     for stu in students:
#         print str(stu);

# print "testing````````````````````"

def arrange_remaing_students(final_teams_bi,students):
    score_insertion_students=[]
    score_insertion_index=[]

    # print "HEYyyyyyyyyyyyyyyyyyyyyyy"
    # print "In arranging remainging students: ", students
    for stud in students:
        score_insertion_student=[]
        for inditeam in final_teams_bi:
            inditeam.member.append(stud)
            score_insertion_student.append(inditeam.calScore())
            inditeam.member.pop()

        score_insertion_students.append(score_insertion_student)
    # TODO: Will need to change
    if (len(students) >= number_student_per_team_lo):
        # getting combination of remaining
        combinations_remainder = [];
        ##################################Create new method to generate all possible combinations with remaining students
        for i in range(number_student_per_team_lo,number_student_per_team_hi+1):
            genAllCombination(students,combinations_remainder,[],i,0,0, {});
        #getting the sorted
        all_possible_sorted_teams_remainder = changeToSortedTeams(combinations_remainder,weightList, constraintsList, class_avg_leadership, class_avg_gender);

        # final teams with remaining students
        final_teams_remainder = selectTeams(all_possible_sorted_teams_remainder)
        for team in final_teams_remainder:
            final_teams_bi.append(team)

    else:
        while not (len(score_insertion_students) is 0):
            maxindex=np.argmax(np.max(score_insertion_students, axis=1))
            # maxindex refers to the position in list score_insertion_students where got the highest score
            score_insertion_index=np.argmax(score_insertion_students,axis=1)
            # score_insertion_index refers to the index of each student's maximized-score-inserting team
            score_insertion_students[maxindex][score_insertion_index[maxindex]]=0
            # whether or not current insertion is successful,I will set this value to 0 to make sure this option will not be considered anymore
            if len(final_teams_bi[score_insertion_index[maxindex]].member)< number_student_per_team_hi: #i will check if the team this student is going into violates the maximum number
                final_teams_bi[score_insertion_index[maxindex]].member.append(students.pop(maxindex)) #here we append with the highest possible score option

                final_teams_bi[score_insertion_index[maxindex]].score = final_teams_bi[score_insertion_index[maxindex]].calScore()
                score_insertion_students.pop(maxindex)

                for element in score_insertion_students:
                    #after the insertion is finished this inserted team should not be considered anymore
                    element[score_insertion_index[maxindex]]=0

arrange_remaing_students(final_teams, students)

# for team in final_teams:
    # print str(team);
    # print team.calScore()

# print "RESULTS"
# print final_teams
# for team in final_teams:
#     temp = []
#     for student in team.member:
#         temp.append(str(student))
#     result.append(temp)

# result = []
result = ''
for team in final_teams:
    # print json.dumps(team.__dict__)
    # result.append(team.toJSON())
    result += team.toJSON() + " $ "
# RESULT
print result
sys.stdout.flush()

''' Check if there are students unselected '''
# print all students who have not been selected
# if len(students) is 0:
#     print "All students have been selected!"
# else:
#     print "The non-selected students are: "
#     for stu in students:
#         print str(stu);

# print "Swapping Student based on team score"
# suggestedSwaps = suggestSwaps_bos(studentToSwap, final_teams)
# print suggestedSwaps
# studentsuggested=suggestedSwaps[0][0]
# print studentsuggested
# swapStudents(studentToSwap, studentsuggested, final_teams)
# print("--- %s seconds --- for swapping a student" % (time.time() - start_time))
