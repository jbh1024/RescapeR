using RescapeR.Core;
using TMPro;
using UnityEngine;

namespace RescapeR.UI
{
    public class ResultScreenController : MonoBehaviour
    {
        [SerializeField] private GameObject panelRoot;
        [SerializeField] private TMP_Text gradeText;
        [SerializeField] private TMP_Text totalTimeText;
        [SerializeField] private TMP_Text deathCountText;

        private void OnEnable()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnRunEnded += ShowResult;
                GameManager.Instance.OnFloorChanged += HandleFloorChanged;
            }
        }

        private void OnDisable()
        {
            if (GameManager.Instance != null)
            {
                GameManager.Instance.OnRunEnded -= ShowResult;
                GameManager.Instance.OnFloorChanged -= HandleFloorChanged;
            }
        }

        private void Start()
        {
            if (panelRoot != null)
            {
                panelRoot.SetActive(false);
            }
        }

        private void ShowResult(ResultGrade grade, int totalSeconds, int deathCount)
        {
            if (panelRoot != null)
            {
                panelRoot.SetActive(true);
            }

            if (gradeText != null)
            {
                gradeText.text = ResultGradeCalculator.GetKoreanLabel(grade);
            }

            if (totalTimeText != null)
            {
                totalTimeText.text = $"총 소요 시간: {totalSeconds / 60:00}:{totalSeconds % 60:00}";
            }

            if (deathCountText != null)
            {
                deathCountText.text = $"사망 횟수: {deathCount}";
            }
        }

        private void HandleFloorChanged(Data.FloorId _)
        {
            if (panelRoot != null)
            {
                panelRoot.SetActive(false);
            }
        }
    }
}
