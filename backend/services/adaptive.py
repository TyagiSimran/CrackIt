def compute_adaptive_difficulty(current_difficulty: str, recent_scores: list[float]) -> str:
    """
    Adaptive difficulty logic:
    - If avg of last 3 scores >= 8: increase difficulty
    - If avg of last 3 scores <= 4: decrease difficulty
    - Otherwise: keep current difficulty
    """
    if len(recent_scores) < 3:
        return current_difficulty

    avg = sum(recent_scores[-3:]) / 3
    levels = ["Easy", "Medium", "Hard"]
    current_idx = levels.index(current_difficulty) if current_difficulty in levels else 1

    if avg >= 8 and current_idx < 2:
        return levels[current_idx + 1]
    elif avg <= 4 and current_idx > 0:
        return levels[current_idx - 1]
    
    return current_difficulty
