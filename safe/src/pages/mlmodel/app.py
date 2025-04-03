from flask import Flask, render_template, request
from flask_cors import CORS
import json
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.svm import SVC
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import RandomForestClassifier
import pickle

app = Flask(__name__)
# Allow CORS from any origin for development
cors = CORS(app, resources={r"/*": {"origins": "*"}})

DATA_PATH = "Training.csv"
data = pd.read_csv(DATA_PATH).dropna(axis = 1)

encoder = LabelEncoder()
data["prognosis"] = encoder.fit_transform(data["prognosis"])

X = data.iloc[:,:-1]

svm_model = pickle.load(open('svm_model.pkl', 'rb'))
nb_model = pickle.load(open('nb_model.pkl', 'rb'))
rf_model = pickle.load(open('rf_model.pkl', 'rb'))

symptoms = X.columns.values
 
symptom_index = {}
for index, value in enumerate(symptoms):
    symptom = " ".join([i.capitalize() for i in value.split("_")])
    symptom_index[symptom] = index
 
data_dict = {
    "symptom_index":symptom_index,
    "predictions_classes":encoder.classes_
}

# Replace mode with a custom function
def get_most_common(predictions):
    """Return the most common prediction"""
    # Count occurrences of each prediction
    prediction_counts = {}
    for pred in predictions:
        if pred in prediction_counts:
            prediction_counts[pred] += 1
        else:
            prediction_counts[pred] = 1
    
    # Find the prediction with the highest count
    max_count = 0
    most_common = None
    for pred, count in prediction_counts.items():
        if count > max_count:
            max_count = count
            most_common = pred
    
    return most_common

@app.route('/<s>', methods=['GET'])
def predict(s):
    try:
        s = json.loads(s)
        symptoms = []
        for x in s.keys():
            # Handle multiple boolean representations
            if s[x] is True or s[x] == "true" or s[x] == "True":
                symptoms.append(x)
        
        input_data = [0] * len(data_dict["symptom_index"])
        for symptom in symptoms:
            if symptom in data_dict["symptom_index"]:
                index = data_dict["symptom_index"][symptom]
                input_data[index] = 1
             
        input_data = np.array(input_data).reshape(1,-1)

        rf_prediction = data_dict["predictions_classes"][rf_model.predict(input_data)[0]]
        nb_prediction = data_dict["predictions_classes"][nb_model.predict(input_data)[0]]
        svm_prediction = data_dict["predictions_classes"][svm_model.predict(input_data)[0]]
        
        # Use our custom function instead of scipy's mode
        final_prediction = get_most_common([rf_prediction, nb_prediction, svm_prediction])
        
        return json.dumps(final_prediction)
    except Exception as e:
        print(f"Error in prediction: {str(e)}")
        return json.dumps({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)