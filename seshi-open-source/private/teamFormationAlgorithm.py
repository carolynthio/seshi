import csv
import heapq
from student import student
from team import team
from team import calSchedule
from team import overlap
from swapping_student import *
import sys
import time
import numpy as np
import operator

import sys
import json

start_time = time.time()

###############################
##### define helper flags #####
###############################
unit_test = False;
debug = False;


########################################
##### import students from file ########
########################################

# Generates all combinations of student teams
def genAllCombination(all_students,combinations, curr_team_list, number_students_needed, team_num,index):
	if calSchedule(curr_team_list) < mini_common_time_slots:
		return team_num;

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
			team_num = genAllCombination(all_students,combinations,curr_team_list,number_students_needed-1,team_num,i+1);
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

		#find the student with minimum number of teams
		min_num = sys.maxint;
		min_stu = students[0];

		for stu in stu_num:
			if (stu_num[stu] < min_num):
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


'''
	Main Function
'''

''' Set the parameters here '''
mini_common_time_slots = 8;
number_student_per_team_lo = int(sys.argv[1]);
number_student_per_team_hi = int(sys.argv[2]);

filename = "assets/app/Dataset1.csv"; # TODO: Will need to change to read from file input
# filename = "Dataset1.csv";
students = [];
weight1 = 1;

''' import student from the file '''

with open (filename,'rU') as data_file:
	student_data = csv.reader(data_file);
	next(student_data, None); # skip the header
	for row in student_data:
		temp = student(row[0],float(row[1]),float(row[2]),debug);
		temp_list = row[3:];
		temp_list = map(int,temp_list);
		temp_schedule = temp_list;
		students.append(temp);
		temp.student_schedule = temp_schedule;

studentRoster = students;
studentToSwap = students[0]
gender = [s.gender for s in students]
class_avg_gender = sum(gender) / len(gender)
leadership = [s.leadership for s in students]
class_avg_leadership = sum(leadership) / len(leadership)
constraintsList = ["schedule"];

if debug:
	print "Here are all the students: "
	for curr in students:
		print(curr);
		#print sum(curr.student_schedule);

# print("--- %s seconds --- for parsing csv" % (time.time() - start_time))

''' Find all the combinations '''
combinations = [];
for i in range(number_student_per_team_lo,number_student_per_team_hi+1):
	genAllCombination(students,combinations,[],i,0,0);
# print("--- %s seconds --- for generating all combinations" % (time.time() - start_time))

''' Change the combinations to be teams(team object) '''

all_possible_sorted_teams = changeToSortedTeams(combinations,[], constraintsList, class_avg_leadership, class_avg_gender);
# for team in all_possible_sorted_teams:
# 	print str(team);
# print("--- %s seconds --- for change all combinations to teams" % (time.time() - start_time))


''' Select a set of feasible teams from the team object '''
final_teams = selectTeams(all_possible_sorted_teams);
# print("--- %s seconds --- for selecting all the teams" % (time.time() - start_time))
# for team in final_teams:
# 	print str(team);

# if len(students) is 0:
# 	print "All students have been selected!"
# else:
# 	print "The non-selected students are: "
# 	for stu in students:
# 		print str(stu);

# print "testing````````````````````"
def arrange_remaing_students(final_teams_bi,students):
	score_insertion_students=[]
	score_insertion_index=[]

	for stud in students:
		score_insertion_student=[]
		for inditeam in final_teams_bi:
			inditeam.member.append(stud)
			score_insertion_student.append(inditeam.calScore())
			inditeam.member.pop()

		score_insertion_students.append(score_insertion_student)

	while not (len(score_insertion_students) is 0):
		maxindex=np.argmax(np.max(score_insertion_students, axis=1))
		score_insertion_index=np.argmax(score_insertion_students,axis=1)
		final_teams_bi[score_insertion_index[maxindex]].member.append(students.pop(maxindex))
		# print score_insertion_index
		# print score_insertion_students
		score_insertion_students.pop(maxindex)
		for element in score_insertion_students:
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
# 	print "All students have been selected!"
# else:
# 	print "The non-selected students are: "
# 	for stu in students:
# 		print str(stu);

# print "Swapping Student based on team score"
# suggestedSwaps = suggestSwaps_bos(studentToSwap, final_teams)
# print suggestedSwaps
# studentsuggested=suggestedSwaps[0][0]
# print studentsuggested
# swapStudents(studentToSwap, studentsuggested, final_teams)
# print("--- %s seconds --- for swapping a student" % (time.time() - start_time))
