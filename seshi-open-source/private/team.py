'''
This file defines the team object

'''


from student import student
import math
import json

total_time_slots = 91.0; # Overall number of possible time slots

class team:
	'''
	datafield:
		member
		score
	'''
	member = [];
	score = 0;

	def __init__(self, combination, weights, constraintsList, class_avg_leadership, class_avg_gender):
		self.member = combination;
		self.constraintsList = constraintsList;
		self.class_avg_leadership = class_avg_leadership
		self.class_avg_gender = class_avg_gender
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
		if "schedule" in self.constraintsList:
			totalScore += calScheduleScore(self.member)
		if "leadership" in self.constraintsList:
			totalScore += calLeadership(self.member, self.class_avg_leadership)
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
def calScheduleScore(students_in_this_team):
	return calSchedule(students_in_this_team) / total_time_slots;

# Calculate the leadership score of a team -- balanced leaders
def calLeadership(students_in_this_team, class_avg_leadership):
	if (len(students_in_this_team) == 0):
		return -1;

	team_avg_leadership = sum([s.leadership for s in students_in_this_team]) / len(students_in_this_team)

	return math.exp(-abs(team_avg_leadership-class_avg_leadership))
