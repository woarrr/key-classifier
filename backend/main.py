import pandas as pd
import io
import time
import json
import collections
import joblib
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sklearn.metrics import f1_score, precision_score, recall_score, accuracy_score, confusion_matrix

# --- ПОДКЛЮЧЕНИЕ ПРЕДОБРАБОТКИ ---
try:
    from preprocessing import preprocess_user_data, STOP_WORDS
    print("Preprocessing и STOP_WORDS успешно подключены.")
except ImportError:
    print("Preprocessing не найден.")
    def preprocess_user_data(text): return str(text).lower()
    STOP_WORDS = set() 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- ЗАГРУЗКА МОДЕЛИ ---
model = None
try:
    model = joblib.load('final_logreg_tfidf_model.pkl')
    print("Модель загружена!")
except Exception as e:
    print(f"Ошибка загрузки модели: {e}")

# --- ФУНКЦИИ ---

def decode_prediction(pred):
    """0->Neutral, 1->Positive, 2->Negative"""
    try:
        if hasattr(pred, 'item'): pred = pred.item()
        p = str(pred).lower().strip()
        if p in ['0', '0.0', 'neutral', 'neu']: return 'neutral'
        if p in ['1', '1.0', 'positive', 'pos']: return 'positive'
        if p in ['2', '2.0', 'negative', 'neg', '-1']: return 'negative'
        return 'neutral'
    except:
        return 'neutral'

def clean_column_names(df):
    df.columns = [str(c).strip().lower().replace('\ufeff', '') for c in df.columns]
    return df

def find_target_columns(df):
    text_col = None
    source_col = None
    for candidate in ['text', 'review', 'отзыв', 'текст', 'comment']:
        if any(candidate == col for col in df.columns): text_col = candidate; break
    if not text_col:
        for col in df.columns: 
            if 'text' in col or 'review' in col: text_col = col; break
    for candidate in ['src', 'source', 'platform', 'источник']:
        if any(candidate == col for col in df.columns): source_col = candidate; break
    return text_col, source_col

def get_top_words(texts, n=7):
    """
    Считает топ слов, ИСКЛЮЧАЯ мусорные слова из STOP_WORDS.
    """
    if not texts: return []
    
    counter = collections.Counter()
    sample = texts if len(texts) < 5000 else texts[:5000]
    
    for t in sample:
        words = str(t).split()
        for w in words:
            if len(w) > 2 and w not in STOP_WORDS and not w.isdigit():
                counter[w] += 1
        
    return [{"word": w, "count": int(c)} for w, c in counter.most_common(n)]

# --- ЧТЕНИЕ ФАЙЛА ---
def smart_read_file(contents, filename):
    if filename.endswith('.csv'):
        try: return pd.read_csv(io.BytesIO(contents), sep=None, engine='python')
        except: 
            try: return pd.read_csv(io.BytesIO(contents), sep=',')
            except: return pd.read_csv(io.BytesIO(contents), sep=';')
    elif filename.endswith(('.xls', '.xlsx')):
        return pd.read_excel(io.BytesIO(contents))
    return None

# --- АНАЛИЗ ---
@app.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    start_time = time.time()
    try:
        contents = await file.read()
        filename = file.filename.lower()
        
        df = smart_read_file(contents, filename)
        if df is None: raise HTTPException(status_code=400, detail="Ошибка чтения файла")
            
        df = clean_column_names(df)
        text_col, source_col = find_target_columns(df)
        
        if not text_col: text_col = df.columns[0]

        # Обработка
        df = df.dropna(subset=[text_col])
        df[text_col] = df[text_col].astype(str)
        
        # Лемматизация (сразу весь столбец)
        clean_texts = df[text_col].apply(preprocess_user_data)

        # Предсказание
        if model:
            raw_preds = model.predict(clean_texts)
            decoded_preds = [decode_prediction(p) for p in raw_preds]
        else:
            decoded_preds = ['neutral'] * len(df)

        # Сборка ответа
        reviews_data = []
        text_vals = df[text_col].tolist()
        source_vals = df[source_col].fillna("Unknown").astype(str).tolist() if source_col else ["Unknown"] * len(df)

        for i, (txt, sent, src) in enumerate(zip(text_vals, decoded_preds, source_vals)):
            reviews_data.append({
                "id": i,
                "text": txt,
                "sentiment": sent,
                "source": src.strip()
            })

        # Статистика
        dist = collections.Counter(decoded_preds)
        src_counts = collections.Counter([r['source'] for r in reviews_data])
        total_src = sum(src_counts.values())
        
        source_dist = []
        if total_src > 0:
            for k, v in src_counts.most_common(10):
                source_dist.append({"name": k, "value": float(round((v / total_src) * 100, 1))})

        # --- ТОП СЛОВ (ФИЛЬТРАЦИЯ) ---
        pos_lemmas = [clean_texts.iloc[i] for i, sent in enumerate(decoded_preds) if sent == 'positive']
        neg_lemmas = [clean_texts.iloc[i] for i, sent in enumerate(decoded_preds) if sent == 'negative']

        top_words = {
            "positive": get_top_words(pos_lemmas),
            "negative": get_top_words(neg_lemmas)
        }

        return {
            "total_reviews": len(reviews_data),
            "processing_time": f"{round(time.time() - start_time, 2)}s",
            "sentiment_distribution": {
                "positive": dist.get("positive", 0),
                "negative": dist.get("negative", 0),
                "neutral": dist.get("neutral", 0)
            },
            "source_distribution": source_dist,
            "top_words": top_words,
            "reviews": reviews_data
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/validate")
async def validate_metrics(file: UploadFile = File(...), predictions_json: str = Form(...)):
    try:
        preds_data = json.loads(predictions_json)
        y_pred = [p['sentiment'] for p in preds_data]

        contents = await file.read()
        filename = file.filename.lower()
        df_true = smart_read_file(contents, filename)
        if df_true is None: raise HTTPException(status_code=400, detail="Ошибка чтения файла")
            
        df_true = clean_column_names(df_true)
        
        target_col = None
        for col in df_true.columns:
            if col in ['sentiment', 'target', 'label', 'class', 'оценка']: target_col = col; break
        
        if not target_col: target_col = df_true.columns[1] if len(df_true.columns) > 1 else df_true.columns[0]

        min_len = min(len(y_pred), len(df_true))
        y_pred = y_pred[:min_len]
        
        raw_true = df_true[target_col].astype(str).str.lower().str.strip().tolist()[:min_len]
        y_true = [decode_prediction(x) for x in raw_true]

        f1 = f1_score(y_true, y_pred, average='macro', zero_division=0)
        precision = precision_score(y_true, y_pred, average='macro', zero_division=0)
        recall = recall_score(y_true, y_pred, average='macro', zero_division=0)
        accuracy = accuracy_score(y_true, y_pred)
        cm = confusion_matrix(y_true, y_pred, labels=['negative', 'neutral', 'positive'])

        return {
            "f1_macro": round(float(f1), 2),
            "precision": round(float(precision), 2),
            "recall": round(float(recall), 2),
            "accuracy": round(float(accuracy), 2),
            "confusion_matrix": {"labels": ["Neg", "Neu", "Pos"], "matrix": cm.tolist()}
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)