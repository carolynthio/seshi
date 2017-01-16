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
    members.append(member);

constraintsList = sys.argv[4].split(',')
team = team(members, 0, constraintsList , float(sys.argv[3]), float(sys.argv[2]));

result = ""
result += str(team.score) + " & " + str(team.overlappingSchedule)
print result
sys.stdout.flush()
