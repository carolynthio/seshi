import random
import sys

# def create_random_teams(people_per_team, listParam):
#
people_per_team = int(sys.argv[1])
list = [x.strip() for x in  sys.argv[2].split(',')]
i = 0
teams = []
team = []
length = len(list)
while length > 0:
   while (i < people_per_team and len(list) > 0):
       student = random.choice(list)
       team.append(student)
       list.remove(student)
       i += 1
   i = 0
   teams.append(team)
   team = []
   length = len(list)
print(teams)
sys.stdout.flush()
    # return teams

# create_random_teams(sys.argv[1], sys.argv[2])
