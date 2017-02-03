'''
This file defines the team object

'''


from student import student
import math
import json

# total_time_slots = 91.0; # Overall number of possible time slots

class team:
	'''
	datafield:
		member
		score
	'''
	member = [];
	score = 0;
	min_common_time = 0;


	def __init__(self, combination, weights, constraintsList, class_avg_leadership, class_avg_gender):
		self.member = combination;
		self.constraintsList = constraintsList;
		self.class_avg_leadership = class_avg_leadership
		self.class_avg_gender = class_avg_gender
		self.weights = weights
		self.score = self.calScore();
		self.overlappingSchedule = self.teamSchedule(combination)

	def __str__(self):
		res = "";
		for student in self.member:
			res += str(student) + ",";
		res += "has score "+str(self.score);
		return res;

	def toJSON(self):
		return json.dumps(self, default=lambda o: o.__dict__,sort_keys=True)

	# Calculate the score of each team
	def calScore(self):
		totalScore = 0;
		# outOf = 0.0;
		if "schedule" in self.constraintsList:
			index = self.constraintsList.index("schedule")
			totalScore += calScheduleScore(self.member,self.min_common_time) * self.weights[index]
			# outOf += 1;
		if "leadership" in self.constraintsList:
			index = self.constraintsList.index("leadership")
			totalScore += calLeadership(self.member) * self.weights[index]
			# outOf += 1;
		if "gender" in self.constraintsList:
			index = self.constraintsList.index("gender")
			totalScore += calGender(self.member) * self.weights[index]
			# outOf += 1;
		if "roleDistribution" in self.constraintsList:
			index = self.constraintsList.index("roleDistribution")
			totalScore += calRoledistribution(self.member) * self.weights[index]
			# outOf += 1;
		return totalScore;

	# Returns the overlapping team schedule
	def teamSchedule(self, students_in_this_team):
		if (len(students_in_this_team) == 0):
			return 100 ;

		temp_schedule = students_in_this_team[0].student_schedule;

		for i in range(1,len(students_in_this_team)):
			temp_schedule = overlap(temp_schedule,students_in_this_team[i].student_schedule);

		schedule = [temp_schedule[x:x+13] for x in range(0, len(temp_schedule), 13)]
		return schedule;

	def getScore(self):
		return self.score;

	def getMembers(self):
		return self.member;

	def hasDupMember(self,that):
		for stu1 in self.getMembers():
			if stu1 in that.getMembers():
				return True;
		return False;

# returns the overlapping schedule between 2 students
def overlap(a,b):
	return [k & l for k,l in zip(a,b)];

# calculate the number of common time slot for three students
def calSchedule(students_in_this_team):

	#print students_in_this_team;

	if (len(students_in_this_team) == 0):
		return 100 ;

	temp_schedule = students_in_this_team[0].student_schedule;

	for i in range(1,len(students_in_this_team)):
		temp_schedule = overlap(temp_schedule,students_in_this_team[i].student_schedule);

	#print temp_schedule;

	return sum(temp_schedule);

# Calculate the schedule score
def calScheduleScore(students_in_this_team,min_common_time):
	common_time = calSchedule(students_in_this_team);
	if (common_time >= min_common_time):
		return 1;
	else:
		return float(common_time) / min_common_time;

# Calculate the leadership score of a team -- balanced leaders
# score 1 for num of leadership is 1;
# Otherwise return 0

def calLeadership(students_in_this_team):
	if (len(students_in_this_team) == 0):
		return -1;

	num_leader = 0;

	for stu in students_in_this_team:
		if stu.leadership == 1:
			num_leader += 1;

	if (num_leader == 1):
		return 1;
	else:
		return 0;
# caluclate the gender score of a team --
# score 1 if num of females are >= 2 || < 1
# Otherwise 0;
def calGender(students_in_this_team):
	if (len(students_in_this_team) == 0):
		return -1;

	num_female = 0;

	for stu in students_in_this_team:
		if stu.gender == 1:
			num_female += 1;

	if num_female == 1:
		return 0;
	else:
		return 1;

	# team_avg_leadership = sum([s.leadership for s in students_in_this_team]) / len(students_in_this_team)
	# return math.exp(-abs(team_avg_leadership-class_avg_leadership))

def calRoledistribution(students_in_this_team):
	if (len(students_in_this_team) == 0):
		return -1;

	num_roles = 3;
	role_set=set([])

	for stu in students_in_this_team:
		role_set=role_set.union(set([stu.role]))

	return float(len(role_set))/num_roles;
