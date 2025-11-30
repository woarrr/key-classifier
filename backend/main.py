import pandas as pd
import io
import time
import json
import collections
import joblib
import sys

try:
    import multipart
    multipart.multipart.MAX_MEMORY_PARAM = 256 * 1024 * 1024 
    multipart.multipart.MAX_MEMORY_FILE = 256 * 1024 * 1024 
except:
    pass

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sklearn.metrics import f1_score, precision_score, recall_score, accuracy_score, confusion_matrix


try:
    from preprocessing import preprocess_user_data
    print("✅ Preprocessing успешно подключен.")
except ImportError:
    print("⚠️ Preprocessing не найден. Используем базовую очистку.")
    def preprocess_user_data(text): return str(text).lower()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
try:
    model = joblib.load('final_logreg_tfidf_model.pkl')
    print("Модель загружена!")
except Exception as e:
    print(f"Ошибка загрузки модели: {e}")

# ФУНКЦИИ

def decode_prediction(pred):
    """
    0 -> Neutral (Нейтрально)
    1 -> Positive (Позитив)
    2 -> Negative (Негатив)
    """
    try:
        if hasattr(pred, 'item'): pred = pred.item()
        p = str(pred).lower().strip()
        
        # 0 -> Neutral
        if p in ['0', '0.0', 'neutral', 'neu']: return 'neutral'
        
        # 1 -> Positive
        if p in ['1', '1.0', 'positive', 'pos']: return 'positive'
        
        # 2 -> Negative
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
    
    # Ищем текст
    for candidate in ['text', 'review', 'отзыв', 'текст', 'comment']:
        for col in df.columns:
            if candidate == col: text_col = col; break
        if text_col: break
    
    if not text_col:
        for col in df.columns: 
            if 'text' in col or 'review' in col: text_col = col; break
    
    # Ищем источник
    for candidate in ['src', 'source', 'platform', 'источник']:
        for col in df.columns:
            if candidate == col: source_col = col; break
        if source_col: break

    return text_col, source_col

def get_top_words(texts, n=5):

    if not texts: return []
    counter = collections.Counter()
    
    sample = texts if len(texts) < 10000 else texts[:10000]
    
    for t in sample:
        words = str(t).split()
        counter.update(words)
        
    return [{"word": w, "count": int(c)} for w, c in counter.most_common(n)]

def smart_read_file(contents, filename):
    if filename.endswith('.csv'):
        try: return pd.read_csv(io.BytesIO(contents), sep=None, engine='python')
        except: 
            try: return pd.read_csv(io.BytesIO(contents), sep=',')
            except: return pd.read_csv(io.BytesIO(contents), sep=';')
    elif filename.endswith(('.xls', '.xlsx')):
        return pd.read_excel(io.BytesIO(contents))
    return None

# АНАЛИЗ
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

        print(f"📥 Начало обработки {len(df)} строк...")
        
        df = df.dropna(subset=[text_col])
        df[text_col] = df[text_col].astype(str)
        
        clean_texts = df[text_col].apply(preprocess_user_data)

        if model:
            raw_preds = model.predict(clean_texts)
            decoded_preds = [decode_prediction(p) for p in raw_preds]
        else:
            decoded_preds = ['neutral'] * len(df)

        reviews_data = []
        text_vals = df[text_col].tolist()
        
        if source_col:
            source_vals = df[source_col].fillna("Unknown").astype(str).tolist()
        else:
            source_vals = ["Unknown"] * len(df)

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

        top_words = {
            "positive": get_top_words([clean_texts.iloc[i] for i, sent in enumerate(decoded_preds) if sent == 'positive']),
            "negative": get_top_words([clean_texts.iloc[i] for i, sent in enumerate(decoded_preds) if sent == 'negative'])
        }

        print(f"Готово за {round(time.time() - start_time, 2)} сек.")

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
        print(f"Analyze Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/validate")
async def validate_metrics(file: UploadFile = File(...), predictions_json: str = Form(...)):
    try:
        # 1. Получаем предсказания
        preds_data = json.loads(predictions_json)
        y_pred = [p['sentiment'] for p in preds_data]

        # 2. Читаем файл с ответами
        contents = await file.read()
        filename = file.filename.lower()
        df_true = smart_read_file(contents, filename)
        
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
        print(f"Validate Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)