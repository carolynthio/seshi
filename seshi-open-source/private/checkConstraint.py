from team import team
from student import student
import team as t
import sys
import json

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

def checkSchedule(team, value):
	students = team.getMembers();
	num_slots = t.calSchedule(students);
	if (num_slots >= value):
		return True;
	return False;


''' get the specific team from the result team '''
final_teams_args = sys.argv[1];

# obj = json.loads(final_teams_args[i], object_hook=lambda d: namedtuple('X', d.keys())(*d.values()))
obj = json.loads(final_teams_args)
members = []

for m in obj["member"]:
    #name,gender,leadership
	tempStudent = student(m["name"], m["gender"],m["leadership"], m["debug"])
	tempStudent.student_schedule = m["student_schedule"]
	members.append(tempStudent)

tempTeam = team(members, 0, obj["constraintsList"], obj["class_avg_leadership"], obj["class_avg_gender"] );
tempTeam.score = obj["score"];
tempTeam.overlappingSchedule = obj["overlappingSchedule"];

result = []

if (not checkbalance(tempTeam,"gender")):
	# print str(tempTeam)+" violate: "+"gender";
    result.append("gender");

if (not checkbalance(tempTeam,"leadership")):
	# print str(tempTeam)+" violate: "+"leadership";
    result.append("leadership");


if (not checkSchedule(tempTeam,4)):
	# print str(tempTeam)+" violate: "+"schedule";
    result.append("schedule");

result = ','.join(result)
result += "," + sys.argv[3];
print result
sys.stdout.flush()
