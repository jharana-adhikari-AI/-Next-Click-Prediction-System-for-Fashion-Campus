# 🛍️ Next-Click Prediction System for Fashion Campus

A hybrid recommendation engine that predicts a user’s next clicked product based on clickstream sequences, using both Markov Chain models and GRU (Gated Recurrent Unit) deep learning. Designed to improve the shopping experience by enhancing product discovery and personalization.

---

## 📌 Problem Statement

Users often leave without completing purchases due to lack of relevant recommendations. Our objective is to:

- Understand user navigation behavior.
- Predict the next-clicked product based on session data.
- Compare Markov Chain and GRU models.
- Visualize user journeys and product relationships.

---

## 📊 Datasets Used

- **Clickstream**: 12.8M records (sampled to 100K)
- **Customer Demographics**: 100K entries
- **Product Metadata**: 44K entries
- **Transactions**: 850K records

---

## 🛠️ Feature Engineering

- Sequential product clicks per session.
- Time features: hour, weekday, time since last click.
- Session metrics: click counts, dwell time, etc.
- Word2Vec for product embeddings.

---

## 🧠 Models Implemented

| Model         | Top-1 Accuracy | Top-3 Accuracy |
|---------------|----------------|----------------|
| Markov Chain  | 88.68%         | 90.07%         |
| GRU (Deep NN) | 87.16%         | 88.51%         |

- **Markov Chain**: Fast and efficient for simple sessions.
- **GRU**: Handles complex user behavior better.

---

## 🔧 Tools & Libraries

- Python, Pandas, NumPy
- Gensim (Word2Vec)
- TensorFlow/Keras (GRU)
- Seaborn, NetworkX (Visualization)
- t-SNE (Dimensionality reduction)

---

## 🖼️ Visualizations

- Product embeddings (t-SNE plots)
- Clickstream transition graphs
- Heatmaps of user journeys

---

## 🚀 Future Enhancements

- Real-time prediction and feedback loop
- Use of Transformers (e.g., BERT4Rec)
- Integration with user demographics
- Cloud deployment on AWS/GCP
- Reinforcement learning for personalization

---

## 📂 How to Run

1. Clone the repo:
    ```bash
    git clone https://github.com/your-username/fashion-campus-next-click.git
    cd fashion-campus-next-click
    ```

2. Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

3. Interact with the model using CLI or notebook.

---

## 📚 References

- Hwangbo H. (2022). Sequence-aware recommenders...
- Jiang J. et al. (2020). TPG-DNN...
- Zhang H. & Chen Y. (2022). Deep Markov model...
- [Fashion Campus Dataset on Kaggle](https://www.kaggle.com/datasets/latifahhukma/fashion-campus/data)

---

## 🙌 Contributors

- Jharana Adhikari and team

---

## 📽️ PPT Presentation

You can find the [presentation slides here](link-to-ppt-if-uploaded-or-included-in-repo).

---

## 📬 Contact

For any queries, reach out via [LinkedIn](https://www.linkedin.com/in/jharana-adhikari/)) or open an issue on the repo.
