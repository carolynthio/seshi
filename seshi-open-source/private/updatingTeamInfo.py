from student import student
from team import team

import sys
import json
import ast

teamsToUpdate = ast.literal_eval(sys.argv[1])

members = []
for eachStudent in teamsToUpdate:
    member = student(eachStudent["name"], eachStudent["gender"], eachStudent["leadership"], 0)
    member.student_schedule = map(int, eachStudent["schedule"].split(','))
    member.role = [x.strip() for x in eachStudent["role"]]
    members.append(member);

constraintsList = sys.argv[4].split(',')
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

team = team(members, weightList, constraintsList , float(sys.argv[3]), float(sys.argv[2]));

result = ""
result += str(team.score) + " & " + str(team.overlappingSchedule)
print result
sys.stdout.flush()
