sequence = input()
total_length = len(sequence)
no_consensus_count = sum(1 for char in sequence.lower() if char not in ['a', 'c', 't', 'g'])
no_consensus_percentage = (no_consensus_count / total_length) * 100

print(no_consensus_count / total_length * 100)
