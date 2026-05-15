import random


def generate_teams(players: list[str]):
    shuffled = players.copy()
    random.shuffle(shuffled)

    midpoint = len(shuffled) // 2

    return {
        'team_a': shuffled[:midpoint],
        'team_b': shuffled[midpoint:],
    }
