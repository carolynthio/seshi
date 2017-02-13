from team import team
from student import student
import team as t
import sys
import json
import ast

# mini_common_time_slots = 0
# team.min_common_time = mini_common_time_slots;
constraintsList = []
weightList = []
studentLikesPreferences = False;
studentDislikesPreferences = False;

if(sys.argv[2]):
    constraintsListArg = ast.literal_eval(sys.argv[2])
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
def checkbalance(team,featuretocheck):
	students = team.getMembers();
	numfemale = 0
	offset = 0
	whoprelead = 0
	for student in students:
		if student.gender==1:
			numfemale+=1
		if student.leadership==1:
			whoprelead+=1
	if featuretocheck=="gender":
		ratio=float(numfemale)/len(students)
	if featuretocheck=="leadership":
		ratio=float(whoprelead)/len(students)
	if (ratio>=(0.5-offset))and(ratio<=0.5+offset):
		return True
	else:
		return False
# check Gender constraint
# if has 1 female, return false;
# Otherwise, return true;
def checkGender(team):
	students = team.getMembers();
	val = t.calGender(students);
	if (val == 1):
		return True;
	return False;

def genderDetail(team):
	students = team.getMembers();
	for stu in students:
		if int(stu.gender) == 1:
			return stu.name + " is the only female in the team";
	return None;

# check leadership balance constraint
# if has 1 leadership, return true;
# Otherwise, return false;
def checkLeadership(team):
	students = team.getMembers();
	val = t.calLeadership(students);
	if (val == 1):
		return True;
	return False;

def leadershipDetail(team):
	students = team.getMembers();
	num_follower = 0;
	for stu in students:
		if int(stu.leadership) == 0:
			num_follower += 1;

	if num_follower == len(students):
		return "No leadership in this team";

	res = "Redundant leaders: ";

	for stu in students:
		if int(stu.leadership) == 1:
			res += str(stu)+" ";

	return res;

# if it violates the schedule constraint, return false;
def checkSchedule(team):
	students = team.getMembers();
	num_slots = t.calSchedule(students);
	if (num_slots >= team.min_common_time):
		return True;
	return False;

def scheduleDetail(team):
	students = team.getMembers();
	num_slots = t.calSchedule(students);
	return str(team.min_common_time - num_slots) + " less than the minimum time requirement";

# check the preference constraint violation
def checkPreference(team):
	students = team.getMembers();
	for stu1 in students:
		for stu2 in students:
			if stu2 in stu1.dislikes:
				return False;
	return True;

# show the detail information
# if there is a preference constraint violation
def preferenceDetail(team):
	res = "";
	students = team.getMembers();
	for stu1 in students:
		for stu2 in students:
			if stu2 in stu1.dislikes:
				res += str(stu1)+ " dislikes "+str(stu2)+ "\n";

	return res;


# check the skill distributed for constraint violation
def checkSkill(team):
	skills = [];
	students = team.member;
	for stu in students:
		for skill in stu.role:
			if skill not in skills:
				skills.append(skill);
	return len(skills) == 3;

# show the detail information for skills violation
def skillDetail(team):
	skills = ["UI Design","Programming","Data Analysis"];
	students = team.getMembers();
	for stu in students:
		for skill in stu.role:
			if skill in skills:
				skills.remove(skill);
	res = "This team does not have: ";
	for skill in skills:
		res += skill;

	return res;


''' get the specific team from the result team '''
final_teams_args = sys.argv[1];

# obj = json.loads(final_teams_args[i], object_hook=lambda d: namedtuple('X', d.keys())(*d.values()))
obj = json.loads(final_teams_args)
members = []

for m in obj["member"]:
    #name,gender,leadership
	tempStudent = student(m["name"], m["gender"],m["leadership"], m["debug"])
	tempStudent.student_schedule = m["student_schedule"]
	tempStudent.role = m["role"]
	members.append(tempStudent)

tempTeam = team(members, weightList, obj["constraintsList"], obj["class_avg_leadership"], obj["class_avg_gender"] );
tempTeam.score = obj["score"];
tempTeam.overlappingSchedule = obj["overlappingSchedule"];

result = []

for constraint in constraintsList:
	if (constraint == "schedule"):
		if not checkSchedule(tempTeam):
	    	# print str(tempTeam)+" violate: "+"schedule";
			result.append(scheduleDetail(tempTeam));
			# print scheduleDetail(tempTeam);

	if (constraint == "leadership"):
		if (not checkLeadership(tempTeam)):
			# print str(tempTeam)+" violate: "+"gender";
			result.append(leadershipDetail(tempTeam));
			# print leadershipDetail(tempTeam);

	if (constraint == "gender"):
		if (not checkGender(tempTeam)):
			result.append(genderDetail(tempTeam));
			# print genderDetail(tempTeam);

	if (studentDislikesPreferences):
		if (not checkPreference(tempTeam)):
			result.append(preferenceDetail(tempTeam));

	if (constraint == "roleDistribution"):
		if (not checkSkill(tempTeam)):
			result.append(skillDetail(tempTeam));

# if (not checkbalance(tempTeam,"gender")):
# 	# print str(tempTeam)+" violate: "+"gender";
#     result.append("gender");
#
# if (not checkbalance(tempTeam,"leadership")):
# 	# print str(tempTeam)+" violate: "+"leadership";
#     result.append("leadership");


result = ','.join(result)
result += "," + sys.argv[3];
print result
sys.stdout.flush()
