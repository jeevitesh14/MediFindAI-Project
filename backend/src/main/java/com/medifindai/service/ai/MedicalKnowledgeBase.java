package com.medifindai.service.ai;

import lombok.Builder;
import lombok.Getter;

import java.util.*;

public class MedicalKnowledgeBase {

    @Getter
    @Builder
    public static class MedicineProfile {
        private String name;
        private String genericName;
        private String category;
        private String standardForms;
        private boolean prescriptionRequired;
        private String indications;
        private String mechanism;
        private String sideEffects;
        private String precautions;
        private String interactions;
        private String alternatives;
    }

    private static final Map<String, MedicineProfile> PROFILES = new HashMap<>();

    static {
        // 1. Paracetamol / Acetaminophen
        MedicineProfile paracetamol = MedicineProfile.builder()
                .name("Paracetamol")
                .genericName("Paracetamol / Acetaminophen")
                .category("Analgesic & Antipyretic (Pain Relief & Fever Reducer)")
                .standardForms("Tablets (500mg, 650mg), Oral Suspension, Drops")
                .prescriptionRequired(false)
                .indications("Commonly used to relieve mild-to-moderate pain (such as headaches, muscle aches, toothaches, back pain, and arthritis) and to reduce fever associated with colds and flu.")
                .mechanism("Inhibits central prostaglandin synthesis to elevate pain threshold and regulate hypothalamic heat centers.")
                .sideEffects("Paracetamol is generally well tolerated when taken as directed. Common side effects are rare, but some individuals may experience mild nausea, stomach discomfort, or minor skin allergic reactions. Overdose poses a serious risk of severe liver damage (hepatotoxicity).")
                .precautions("Do not exceed 4,000 mg (4g) within a 24-hour window for adults. Avoid concurrent use of other over-the-counter cold/flu medications containing paracetamol to prevent accidental overdose. Individuals with liver or kidney disease or chronic alcoholism should exercise strict caution.")
                .interactions("Can generally be taken alongside Ibuprofen under medical guidance when pain relief needs vary. Avoid combining with heavy alcohol consumption. High regular doses may interact with blood thinners like Warfarin.")
                .alternatives("Ibuprofen (NSAID for inflammatory pain), Naproxen, or Acetaminophen combination products.")
                .build();
        register(paracetamol, "paracetamol", "acetaminophen", "crocin", "dolo", "dolo 650", "calpol", "tylenol", "panadol");

        // 2. Ibuprofen
        MedicineProfile ibuprofen = MedicineProfile.builder()
                .name("Ibuprofen")
                .genericName("Ibuprofen")
                .category("Non-Steroidal Anti-Inflammatory Drug (NSAID)")
                .standardForms("Tablets (200mg, 400mg), Gel Capsules, Suspension")
                .prescriptionRequired(false)
                .indications("Used for inflammatory pain, arthritis, dental pain, menstrual cramps, muscular injuries, headache, and fever reduction.")
                .mechanism("Inhibits COX-1 and COX-2 enzymes, reducing inflammatory prostaglandin synthesis.")
                .sideEffects("Common side effects include indigestion, stomach irritation, heartburn, and nausea. Prolonged or high-dose use increases the risk of peptic ulcers, gastrointestinal bleeding, and kidney strain.")
                .precautions("Always take with food or a glass of milk to protect your stomach lining. Not recommended for patients with active peptic ulcer disease, severe heart failure, kidney impairment, or aspirin-sensitive asthma.")
                .interactions("Safe to alternate with Paracetamol when managing refractory fever/pain. Avoid combining with other NSAIDs (Aspirin, Naproxen) or systemic corticosteroids without a doctor's supervision due to elevated bleeding risk.")
                .alternatives("Paracetamol (non-NSAID alternative), Naproxen, Diclofenac.")
                .build();
        register(ibuprofen, "ibuprofen", "brufen", "advil", "motrin", "combiflam");

        // 3. Amoxicillin
        MedicineProfile amoxicillin = MedicineProfile.builder()
                .name("Amoxicillin")
                .genericName("Amoxicillin")
                .category("Broad-Spectrum Penicillin Antibiotic")
                .standardForms("Capsules (250mg, 500mg), Oral Suspension")
                .prescriptionRequired(true)
                .indications("Prescribed to treat bacterial infections including ear-nose-throat (ENT) infections, bronchitis, pneumonia, skin infections, and urinary tract infections (UTIs).")
                .mechanism("Inhibits bacterial cell wall synthesis during active multiplication, leading to bactericidal death.")
                .sideEffects("Common side effects include diarrhea, nausea, mild skin rashes, and vomiting. Rarely, severe allergic anaphylaxis or antibiotic-associated colitis (C. difficile) may develop.")
                .precautions("Must be taken as a complete course exactly as prescribed by a physician even if symptoms improve early. Never use for viral infections (like common cold or flu). Contraindicated in patients with penicillin allergy.")
                .interactions("May reduce the efficacy of oral contraceptives. Concurrent use with Methotrexate or Probenecid requires dose adjustment.")
                .alternatives("Azithromycin, Clarithromycin, Cefixime, or Doxycycline (depending on bacterial strain).")
                .build();
        register(amoxicillin, "amoxicillin", "augmentin", "mox", "amoxil", "novamox");

        // 4. Azithromycin
        MedicineProfile azithromycin = MedicineProfile.builder()
                .name("Azithromycin")
                .genericName("Azithromycin")
                .category("Macrolide Antibiotic")
                .standardForms("Tablets (250mg, 500mg), Oral Suspension")
                .prescriptionRequired(true)
                .indications("Prescribed for bacterial respiratory tract infections, tonsillitis, sinonasal infections, skin infections, and certain sexually transmitted infections.")
                .mechanism("Binds reversibly to the 50S ribosomal subunit of bacteria, blocking protein synthesis.")
                .sideEffects("Gastrointestinal discomfort (cramping, loose stools, nausea, vomiting) and headache. Rarely causes liver enzyme elevation or cardiac QT prolongation.")
                .precautions("Requires a valid doctor's prescription. Take 1 hour before or 2 hours after meals. Inform your doctor if you have cardiac arrhythmias or liver impairment.")
                .interactions("Avoid taking aluminum/magnesium antacids at the same time as they diminish absorption. Monitor when taking cardiac QT-prolonging drugs.")
                .alternatives("Amoxicillin, Clarithromycin, Cefuroxime, Doxycycline.")
                .build();
        register(azithromycin, "azithromycin", "azee", "zithromax", "z-pack", "azithral");

        // 5. Cetirizine
        MedicineProfile cetirizine = MedicineProfile.builder()
                .name("Cetirizine")
                .genericName("Cetirizine Hydrochloride")
                .category("Second-Generation Antihistamine")
                .standardForms("Tablets (10mg), Syrup (5mg/5ml)")
                .prescriptionRequired(false)
                .indications("Relief of allergy symptoms: hay fever, allergic rhinitis (sneezing, runny nose, itchy watery eyes), urticaria (hives), and insect bite reactions.")
                .mechanism("Selectively blocks peripheral histamine H1 receptors, diminishing allergic mediators.")
                .sideEffects("Mild drowsiness in some individuals, dry mouth, headache, and mild fatigue.")
                .precautions("While less sedating than 1st-generation antihistamines, caution is advised when driving or operating machinery. Adjust dosage in patients with moderate to severe renal impairment.")
                .interactions("Alcohol and central nervous system (CNS) depressants may augment sedative effects.")
                .alternatives("Loratadine, Fexofenadine (Allegra), Levocetirizine (Xyzal), Bilastine.")
                .build();
        register(cetirizine, "cetirizine", "zyrtec", "cetzine", "alerid", "okacet", "levocetirizine");

        // 6. Pantoprazole
        MedicineProfile pantoprazole = MedicineProfile.builder()
                .name("Pantoprazole")
                .genericName("Pantoprazole Sodium")
                .category("Proton Pump Inhibitor (PPI / Antacid)")
                .standardForms("Tablets (20mg, 40mg Gastro-resistant)")
                .prescriptionRequired(false)
                .indications("Used for gastroesophageal reflux disease (GERD), acid reflux, heartburn, gastritis, and healing peptic ulcers.")
                .mechanism("Suppresses gastric basal and stimulated acid secretion by irreversibly inhibiting the H+/K+ ATPase enzyme in parietal cells.")
                .sideEffects("Generally safe and well tolerated. Occasional headache, diarrhea, nausea, abdominal pain, or flatulence.")
                .precautions("Best taken on an empty stomach in the morning 30 minutes before breakfast. Long-term continuous use (>1 year) may affect magnesium or Vitamin B12 absorption and bone density.")
                .interactions("May alter absorption of medicines requiring acidic gastric pH (like Ketoconazole or Iron supplements). Minimal interaction with Clopidogrel compared to other PPIs.")
                .alternatives("Omeprazole (Prilosec), Esomeprazole (Nexium), Rabeprazole, Famotidine (H2 blocker).")
                .build();
        register(pantoprazole, "pantoprazole", "pantocid", "pan 40", "pantosec", "protonix", "omeprazole", "rabeprazole");

        // 7. Metformin
        MedicineProfile metformin = MedicineProfile.builder()
                .name("Metformin")
                .genericName("Metformin Hydrochloride")
                .category("Oral Antidiabetic (Biguanide)")
                .standardForms("Tablets (500mg, 850mg, 1000mg ER/SR)")
                .prescriptionRequired(true)
                .indications("First-line management of Type 2 Diabetes Mellitus, improving glycemic control, and polycystic ovary syndrome (PCOS).")
                .mechanism("Decreases hepatic glucose production, decreases intestinal absorption of glucose, and improves peripheral insulin sensitivity.")
                .sideEffects("Gastrointestinal disturbance (nausea, abdominal bloating, diarrhea, metallic taste), particularly upon therapy initiation.")
                .precautions("Take with or immediately after meals to minimize stomach upset. Requires periodic renal function monitoring. Contraindicated in severe renal failure.")
                .interactions("Contrast dyes for CT scans (withhold metformin before procedure). Heavy alcohol increases lactic acidosis risk.")
                .alternatives("Glimepiride, Sitagliptin, Dapagliflozin, Empagliflozin (prescribed per physician review).")
                .build();
        register(metformin, "metformin", "glycomet", "glucophage", "gluconorm");

        // 8. Amlodipine
        MedicineProfile amlodipine = MedicineProfile.builder()
                .name("Amlodipine")
                .genericName("Amlodipine Besylate")
                .category("Calcium Channel Blocker (Antihypertensive)")
                .standardForms("Tablets (2.5mg, 5mg, 10mg)")
                .prescriptionRequired(true)
                .indications("Management of hypertension (high blood pressure) and chronic stable angina pectoris (chest pain).")
                .mechanism("Inhibits influx of extracellular calcium across vascular smooth muscle cells, causing peripheral vasodilation.")
                .sideEffects("Peripheral ankle/foot edema (swelling), dizziness, flushing, fatigue, and palpitations.")
                .precautions("Monitor blood pressure regularly. Do not abruptly stop taking without consulting your cardiologist.")
                .interactions("Simvastatin (amlodipine increases simvastatin exposure; limit simvastatin dose to 20mg daily). Avoid grapefruit juice in large quantities.")
                .alternatives("Telmisartan, Losartan, Atenolol, Enalapril (physician prescribed).")
                .build();
        register(amlodipine, "amlodipine", "norvasc", "stamlo", "amlong");

        // 9. Vitamin D3
        MedicineProfile vitaminD = MedicineProfile.builder()
                .name("Vitamin D3")
                .genericName("Cholecalciferol")
                .category("Nutritional Supplement & Bone Health")
                .standardForms("Capsules (60,000 IU), Drops, Chewable Tablets")
                .prescriptionRequired(false)
                .indications("Treatment and prevention of Vitamin D deficiency, bone mineralization, osteoporosis support, and immune function maintenance.")
                .mechanism("Promotes active intestinal absorption of calcium and phosphorus.")
                .sideEffects("Extremely safe within recommended dietary or clinical dosing limits. Excessive chronic intake can lead to hypercalcemia.")
                .precautions("Take with a fat-containing meal for optimal absorption. Check 25(OH) Vitamin D serum levels periodically.")
                .interactions("Thiazide diuretics (increased risk of hypercalcemia). Orlistat reduces absorption.")
                .alternatives("Calcium + Vitamin D3 combination supplements, Ergocalciferol (D2).")
                .build();
        register(vitaminD, "vitamin d", "vitamin d3", "cholecalciferol", "calcirol", "d3");
    }

    private static void register(MedicineProfile profile, String... aliases) {
        for (String alias : aliases) {
            PROFILES.put(alias.toLowerCase(Locale.ROOT), profile);
        }
    }

    public static Optional<MedicineProfile> findProfile(String query) {
        if (query == null || query.isBlank()) return Optional.empty();
        String lower = query.toLowerCase(Locale.ROOT).trim();

        // 1. Direct match
        if (PROFILES.containsKey(lower)) {
            return Optional.of(PROFILES.get(lower));
        }

        // 2. Substring / Token match
        for (Map.Entry<String, MedicineProfile> entry : PROFILES.entrySet()) {
            if (lower.contains(entry.getKey())) {
                return Optional.of(entry.getValue());
            }
        }

        return Optional.empty();
    }

    public static String extractMedicineEntity(String text) {
        if (text == null || text.isBlank()) return "";
        String lower = text.toLowerCase(Locale.ROOT).trim();

        for (String key : PROFILES.keySet()) {
            if (lower.contains(key)) {
                return PROFILES.get(key).getName();
            }
        }
        return "";
    }
}
