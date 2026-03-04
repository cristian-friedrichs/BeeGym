import re
import json

def parse_exercises(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex to match exercise objects
    # Note: icons are ignored as they are not needed in the DB
    pattern = r'{\s*name:\s*\'(.*?)\',\s*description:\s*\'(.*?)\',\s*icon:.*?,?\s*tags:\s*\[(.*?)\],\s*type:\s*\'(.*?)\'\s*}'
    matches = re.finditer(pattern, content, re.DOTALL)

    exercises = []
    for match in matches:
        name = match.group(1)
        description = match.group(2)
        tags_raw = match.group(3)
        # Parse tags list
        tags = [t.strip().strip("'") for t in tags_raw.split(',') if t.strip()]
        type_ = match.group(4)

        if type_ == 'base':
            # Infer category from tags
            categories = ['Musculação', 'Crossfit', 'Cardio', 'Mobilidade', 'Livre']
            category = 'Musculação' # Default
            for cat in categories:
                if cat in tags:
                    category = cat
                    break
            
            # Special case for 'Yoga' (map to Mobilidade or keep Yoga?)
            if 'Yoga' in tags:
                category = 'Mobilidade'
            if 'Aerobico' in tags:
                category = 'Cardio'

            # Infer difficulty
            difficulty = 'Iniciado'
            if 'Iniciante' in tags or 'Iniciantes' in tags:
                difficulty = 'Iniciante'
            elif 'Intermediário' in tags:
                difficulty = 'Intermediário'
            elif 'Avançado' in tags:
                difficulty = 'Avançado'
            else:
                difficulty = 'Iniciante'

            exercises.append({
                "name": name,
                "category": category,
                "target_muscle": description,
                "difficulty": difficulty,
                "tags": tags,
                "organization_id": None
            })
    
    return exercises

def generate_sql(exercises):
    sql = "INSERT INTO public.exercises (name, category, target_muscle, difficulty, tags, organization_id) VALUES\n"
    values = []
    for ex in exercises:
        name = ex['name'].replace("'", "''")
        category = ex['category'].replace("'", "''")
        target_muscle = ex['target_muscle'].replace("'", "''")
        difficulty = ex['difficulty'].replace("'", "''")
        
        # PostgreSQL array syntax: ARRAY['tag1', 'tag2']
        safe_tags = [t.replace("'", "''") for t in ex['tags']]
        tags_sql = "ARRAY[" + ", ".join([f"'{t}'" for t in safe_tags]) + "]"
        
        values.append(f"('{name}', '{category}', '{target_muscle}', '{difficulty}', {tags_sql}, NULL)")
    
    sql += ",\n".join(values) + ";"
    return sql

if __name__ == "__main__":
    file_path = "src/lib/exercises.ts"
    exercises = parse_exercises(file_path)
    print(f"Parsed {len(exercises)} exercises.")
    sql = generate_sql(exercises)
    with open("import_exercises.sql", "w", encoding='utf-8') as f:
        f.write(sql)
    print("Generated import_exercises.sql")
